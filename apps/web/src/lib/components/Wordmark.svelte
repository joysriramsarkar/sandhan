<script lang="ts">
	/**
	 * সন্ধান wordmark — rendered in the four Google brand colours
	 * with Google's logo metrics (Product Sans / Roboto fallback).
	 */
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let title = 'সন্ধান';
</script>

<span class="g-wordmark {size}" role="img" aria-label={title} title={title}>
	<span class="l l0">স</span><span class="l l1">ন্</span><span class="l l2">ধা</span><span class="l l3">ন</span>
</span>

<style>
	.g-wordmark {
		display: inline-flex;
		align-items: baseline;
		font-family: 'Roboto', 'Noto Sans Bengali', Arial, sans-serif;
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1;
		white-space: nowrap;
		user-select: none;
	}
	.l0 { color: #4285f4; }
	.l1 { color: #ea4335; }
	.l2 { color: #fbbc05; }
	.l3 { color: #34a853; }
	.lg {
		font-size: clamp(3rem, 12vw, 5.5rem);
		font-weight: 700;
		letter-spacing: -0.03em;
	}
	.md {
		font-size: 1.75rem;
		letter-spacing: -0.02em;
	}
	.sm {
		font-size: 1.35rem;
	}
	:global([data-theme='dark']) .l0 { color: #8ab4f8; }
	:global([data-theme='dark']) .l1 { color: #f28b82; }
	:global([data-theme='dark']) .l2 { color: #fdd663; }
	:global([data-theme='dark']) .l3 { color: #81c995; }
	@media (max-width: 480px) {
		.lg { font-size: 3rem; }
	}
</style>
