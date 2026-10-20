(function () {
  'use strict';

  var script = document.currentScript;
  var repository = script.dataset.statsRepository;

  // Keep the code link usable if the external stars image is unavailable.
  document.querySelectorAll('.github-stars').forEach(function (image) {
    function hideBrokenBadge() { image.hidden = true; }
    image.addEventListener('error', hideBrokenBadge);
    if (image.complete && !image.naturalWidth) hideBrokenBadge();
  });

  function normalizeTitle(title) {
    return String(title || '').normalize('NFKD').toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function citationCount(value) {
    if (typeof value === 'string' && /^\d+$/.test(value)) value = Number(value);
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }

  function showCitations(data) {
    var publications = data.publications;
    var papers = Object.keys(publications).map(function (id) {
      return { id: id, publication: publications[id] };
    }).filter(function (paper) {
      return paper.publication && typeof paper.publication === 'object';
    });

    document.querySelectorAll('.citation-link').forEach(function (link) {
      var id = link.dataset.scholarId;
      var publication = id && publications[id];
      if (!publication) {
        var title = normalizeTitle(link.dataset.paperTitle);
        var matches = papers.filter(function (paper) {
          return title && normalizeTitle((paper.publication.bib || {}).title) === title;
        });
        // Never guess a count when titles are missing or ambiguous.
        if (matches.length !== 1) return;
        id = matches[0].id;
        publication = matches[0].publication;
      }

      var count = citationCount(publication.num_citations);
      var badge = link.querySelector('.citation-count');
      if (count === null || !badge) return;
      badge.textContent = count.toLocaleString('en-US');
      badge.hidden = false;
      link.setAttribute('aria-label', link.dataset.paperTitle + ': ' + count + ' citations on Google Scholar');
      link.title = 'Google Scholar citations' + (data.updated ? ' · Updated ' + data.updated : '');
      if (/^[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/.test(id)) {
        link.href = 'https://scholar.google.com/citations?view_op=view_citation&citation_for_view=' + encodeURIComponent(id);
      }
    });

    var total = document.getElementById('total_cit');
    var totalCount = citationCount(data.citedby);
    if (total && totalCount !== null) total.textContent = totalCount.toLocaleString('en-US');

    // Retain compatibility with the template's original citation spans.
    document.querySelectorAll('.show_paper_citations').forEach(function (element) {
      var publication = publications[element.getAttribute('data')];
      var count = publication && citationCount(publication.num_citations);
      if (count !== null && count !== undefined) element.textContent = '| Citations: ' + count;
    });
  }

  if (!repository) return;
  var raw = 'https://raw.githubusercontent.com/' + repository + '/google-scholar-stats/gs_data.json';
  var cdn = 'https://cdn.jsdelivr.net/gh/' + repository + '@google-scholar-stats/gs_data.json';
  var sources = script.dataset.statsUseCdn === 'true' ? [cdn, raw] : [raw, cdn];

  function loadSource(index) {
    if (index >= sources.length) return Promise.resolve();
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 10000);
    return fetch(sources[index], { signal: controller.signal }).then(function (response) {
      if (!response.ok) throw new Error('Citation data unavailable');
      return response.json();
    }).then(function (data) {
      if (!data || !data.publications || typeof data.publications !== 'object' || Array.isArray(data.publications)) {
        throw new Error('Invalid citation data');
      }
      showCitations(data);
    }).catch(function () {
      return loadSource(index + 1);
    }).finally(function () { clearTimeout(timeout); });
  }

  // Until a successful crawl is available, links remain useful without invented counts.
  loadSource(0);
}());
