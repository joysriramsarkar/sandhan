export const GET = async () => {
	const siteUrl = 'https://sandhan.site';
	const pages = [
		{ path: '/', priority: '1.0', changefreq: 'daily' },
		{ path: '/dashboard', priority: '0.8', changefreq: 'hourly' },
		{ path: '/launch', priority: '0.9', changefreq: 'weekly' }
	];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages
	.map(
		(p) => `  <url>
    <loc>${siteUrl}${p.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
    <xhtml:link rel="alternate" hreflang="bn" href="${siteUrl}${p.path}" />
    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}${p.path}" />
    <xhtml:link rel="alternate" hreflang="hi" href="${siteUrl}${p.path}" />
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(sitemap.trim(), {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'max-age=3600, s-maxage=3600'
		}
	});
};
