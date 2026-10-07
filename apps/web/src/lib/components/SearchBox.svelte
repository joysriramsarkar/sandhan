<script lang="ts">
	/**
	 * Google-style search pill with on-device autocomplete, voice search and Lens.
	 */
	import { createEventDispatcher, onMount } from 'svelte';
	import GIcon from './GIcon.svelte';
	import { buildSuggestions, type Suggestion } from '$lib/suggest';
	import { getLocale } from '$lib/i18n';

	export let value = '';
	export let placeholder = 'খুঁজুন…';
	export let variant: 'home' | 'serp' = 'home';
	export let sessionQueries: string[] = [];
	export let autofocus = false;
	export let compact = false;

	const dispatch = createEventDispatcher<{
		submit: { q: string };
		lens: { q: string };
		clear: void;
	}>();

	let inputEl: HTMLInputElement;
	let boxEl: HTMLDivElement;
	let suggestions: Suggestion[] = [];
	let isOpen = false;
	let activeIndex = -1;
	let isListening = false;
	let voiceError = '';
	let recognition: any = null;

	onMount(() => {
		if (autofocus) inputEl?.focus();
		if (typeof window !== 'undefined') {
			const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
			if (SR) {
				recognition = new SR();
				recognition.interimResults = true;
				recognition.onresult = (event: any) => {
					const transcript = Array.from(event.results as any[])
						.map((result: any) => result[0].transcript)
						.join(' ');
					value = transcript;
					if (event.results[0].isFinal) {
						isListening = false;
						submit(transcript);
					}
				};
				recognition.onerror = () => {
					isListening = false;
					voiceError = 'ভয়েস সার্চ ব্যর্থ হয়েছে — আবার চেষ্টা করুন';
					setTimeout(() => (voiceError = ''), 3200);
				};
				recognition.onend = () => (isListening = false);
			}
		}
		return () => {
			if (recognition && isListening) recognition.stop();
		};
	});

	function handleInput() {
		isOpen = true;
		activeIndex = -1;
		suggestions = buildSuggestions(value, { sessionQueries });
		dispatch('clear');
	}

	function handleFocus() {
		isOpen = true;
		suggestions = buildSuggestions(value, { sessionQueries });
	}

	function closeSuggestions() {
		isOpen = false;
		activeIndex = -1;
	}

	function handleBlur(event: FocusEvent) {
		const next = event.relatedTarget as Node | null;
		if (next && boxEl?.contains(next)) return;
		closeSuggestions();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			if (!isOpen) {
				handleFocus();
				return;
			}
			event.preventDefault();
			activeIndex = Math.min(activeIndex + 1, suggestions.length - 1);
			if (activeIndex >= 0) value = suggestions[activeIndex].text;
			return;
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = Math.max(activeIndex - 1, -1);
			if (activeIndex >= 0) value = suggestions[activeIndex].text;
			return;
		}
		if (event.key === 'Escape') {
			closeSuggestions();
			inputEl?.blur();
			return;
		}
		if (event.key === 'Enter') {
			event.preventDefault();
			const chosen = activeIndex >= 0 ? suggestions[activeIndex]?.text : value;
			closeSuggestions();
			if (chosen) value = chosen;
			submit(value);
		}
	}

	function pick(suggestion: Suggestion) {
		value = suggestion.text;
		closeSuggestions();
		submit(suggestion.text);
		inputEl?.focus();
	}

	function submit(q: string) {
		const trimmed = (q || '').trim();
		if (!trimmed) return;
		dispatch('submit', { q: trimmed });
	}

	function toggleVoice() {
		if (!recognition) {
			voiceError = 'এই ব্রাউজারে ভয়েস সার্চ সমর্থিত নয়';
			setTimeout(() => (voiceError = ''), 3200);
			return;
		}
		if (isListening) {
			try {
				recognition.stop();
			} catch (_) {}
			isListening = false;
			return;
		}
		const locale = getLocale();
		recognition.lang = locale === 'en' ? 'en-US' : locale === 'hi' ? 'hi-IN' : 'bn-BD';
		try {
			recognition.start();
			isListening = true;
			closeSuggestions();
		} catch (_) {
			isListening = false;
		}
	}

	function handleLens() {
		dispatch('lens', { q: value });
	}

	function clearInput() {
		value = '';
		suggestions = [];
		closeSuggestions();
		inputEl?.focus();
	}

	function boldParts(text: string, match: string) {
		if (!match) return [{ t: text, bold: false }];
		const idx = text.toLowerCase().indexOf(match.toLowerCase());
		if (idx < 0) return [{ t: text, bold: false }];
		return [
			{ t: text.slice(0, idx), bold: false },
			{ t: text.slice(idx, idx + match.length), bold: true },
			{ t: text.slice(idx + match.length), bold: false }
		].filter((part) => part.t.length > 0);
	}
</script>

<div class="g-searchbox {variant}" class:compact bind:this={boxEl}>
	<form
		class="g-search-form"
		role="search"
		on:submit|preventDefault={() => {
			closeSuggestions();
			submit(value);
		}}
	>
		<label class="g-search-field">
			<span class="g-search-icon" aria-hidden="true"><GIcon name="search" size={variant === 'home' ? 20 : 20} /></span>
			<input
				bind:this={inputEl}
				type="text"
				bind:value
				{placeholder}
				autocomplete="off"
				spellcheck="false"
				aria-label="সার্চ"
				aria-autocomplete="list"
				on:input={handleInput}
				on:focus={handleFocus}
				on:blur={handleBlur}
				on:keydown={handleKeydown}
			/>
			{#if value}
				<button
					type="button"
					class="g-icbtn g-clear-btn"
					title="মুছুন"
					on:click={clearInput}
					aria-label="সার্চ বক্স মুছুন"
				>
					<GIcon name="close" size={20} />
				</button>
			{/if}
			<button
				type="button"
				class="g-icbtn g-mic-btn"
				class:listening={isListening}
				title="ভয়েস দিয়ে খুঁজুন"
				on:click={toggleVoice}
				aria-label="ভয়েস সার্চ"
			>
				<GIcon name="mic" size={22} />
			</button>
			<button
				type="button"
				class="g-icbtn g-lens-btn"
				title="ছবি দিয়ে খুঁজুন"
				on:click={handleLens}
				aria-label="ছবি সার্চ"
			>
				<GIcon name="lens" size={22} />
			</button>
		</label>
	</form>

	{#if isOpen && suggestions.length > 0}
		<ul class="g-suggestions" role="listbox">
			{#each suggestions as suggestion, index (suggestion.text)}
				<li>
					<button
						type="button"
						class="g-suggestion"
						class:active={index === activeIndex}
						role="option"
						aria-selected={index === activeIndex}
						on:mousedown|preventDefault
						on:click={() => pick(suggestion)}
					>
						<span class="g-suggest-icon">
							<GIcon name={suggestion.kind === 'history' ? 'clock' : 'search'} size={20} />
						</span>
						<span class="g-suggest-text">
							{#each boldParts(suggestion.text, suggestion.match) as part}
								{#if part.bold}<b>{part.t}</b>{:else}{part.t}{/if}
							{/each}
						</span>
						{#if suggestion.label}
							<span class="g-suggest-label">{suggestion.label}</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if isListening}
		<div class="g-voice-bar" role="status">
			<span class="g-voice-dot"></span>
			<span class="g-voice-text">শুনছি… বলুন</span>
			<button type="button" class="g-voice-stop" on:click={toggleVoice}>বন্ধ করুন</button>
		</div>
	{/if}

	{#if voiceError}
		<div class="g-voice-error" role="alert">{voiceError}</div>
	{/if}
</div>

<style>
	.g-searchbox {
		position: relative;
		width: 100%;
	}
	.g-search-field {
		display: flex;
		align-items: center;
		gap: 4px;
		height: 44px;
		padding: 0 8px 0 14px;
		background: var(--g-surface);
		border: 1px solid var(--g-border);
		border-radius: 24px;
		transition: box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
	}
	.g-searchbox.home .g-search-field:hover,
	.g-searchbox.home .g-search-field:focus-within {
		box-shadow: var(--g-shadow-1);
		border-color: transparent;
	}
	.g-searchbox.serp .g-search-field {
		box-shadow: var(--g-shadow-1);
		border-color: transparent;
	}
	.g-searchbox.serp .g-search-field:focus-within {
		box-shadow: var(--g-shadow-2);
	}
	:global([data-theme='dark']) .g-search-field {
		background: var(--g-surface-2);
		border-color: var(--g-surface-2);
	}
	.g-search-icon {
		display: inline-flex;
		align-items: center;
		color: var(--g-icon);
		flex-shrink: 0;
	}
	.g-search-field input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		font-family: inherit;
		font-size: 16px;
		color: var(--g-text);
		padding: 0 6px 0 8px;
		height: 100%;
	}
	.g-search-field input::placeholder {
		color: var(--g-text-3);
	}
	.g-icbtn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: transparent;
		color: var(--g-icon);
		flex-shrink: 0;
		transition: background 0.15s ease;
	}
	.g-icbtn:hover {
		background: var(--g-hover);
	}
	.g-mic-btn.listening {
		background: #e8f0fe;
	}
	.g-clear-btn {
		display: none;
	}
	@media (max-width: 620px) {
		.g-clear-btn {
			display: inline-flex;
		}
		.g-lens-btn {
			display: none;
		}
	}

	/* Autocomplete */
	.g-suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 40;
		margin: 0;
		padding: 6px 0;
		list-style: none;
		background: var(--g-surface);
		border-radius: 0 0 24px 24px;
		box-shadow: var(--g-shadow-2);
		border-top: 1px solid var(--g-divider);
		overflow: hidden;
	}
	.g-suggestion {
		display: flex;
		align-items: center;
		gap: 14px;
		width: 100%;
		min-height: 36px;
		padding: 4px 16px 4px 18px;
		background: transparent;
		font-family: inherit;
		font-size: 16px;
		color: var(--g-text);
		text-align: left;
	}
	.g-suggestion:hover,
	.g-suggestion.active {
		background: var(--g-hover);
	}
	.g-suggest-icon {
		display: inline-flex;
		color: var(--g-icon);
		flex-shrink: 0;
	}
	.g-suggest-text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.g-suggest-text b {
		font-weight: 700;
	}
	.g-suggest-label {
		font-size: 12px;
		color: var(--g-text-3);
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* Voice search status */
	.g-voice-bar {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 16px;
		background: var(--g-surface);
		border-radius: 24px;
		box-shadow: var(--g-shadow-2);
		font-size: 14px;
		color: var(--g-text-2);
	}
	.g-voice-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #ea4335;
		animation: g-pulse 1.4s infinite;
	}
	.g-voice-text {
		flex: 1;
	}
	.g-voice-stop {
		background: transparent;
		border: 1px solid var(--g-border);
		border-radius: 999px;
		padding: 4px 12px;
		font-size: 13px;
		color: var(--g-blue);
		font-family: inherit;
	}
	.g-voice-error {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		z-index: 40;
		padding: 10px 16px;
		background: var(--g-surface);
		border-radius: 8px;
		box-shadow: var(--g-shadow-2);
		font-size: 14px;
		color: var(--g-red);
	}
	@keyframes g-pulse {
		0% { box-shadow: 0 0 0 0 rgba(234, 67, 53, 0.5); }
		70% { box-shadow: 0 0 0 8px rgba(234, 67, 53, 0); }
		100% { box-shadow: 0 0 0 0 rgba(234, 67, 53, 0); }
	}
</style>
