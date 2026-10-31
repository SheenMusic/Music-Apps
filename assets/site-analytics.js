/* Shared GA4 bootstrap. Each document configures one tag / automatic page_view. */
(() => {
  'use strict';
  if(window.__siteAnalyticsInitialized) return;
  window.__siteAnalyticsInitialized = true;

  const measurementID = 'G-Y3HB3XWG6P';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementID);

  const tagURL = `https://www.googletagmanager.com/gtag/js?id=${measurementID}`;
  const tagExists = [...document.scripts].some(script => script.src === tagURL);
  if(!tagExists){
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = tagURL;
    document.head.append(tag);
  }

  let articleStarted = false;
  window.addEventListener('site:article-loaded', event => {
    if(articleStarted) return;
    const {slug, title} = event.detail || {};
    const body = document.getElementById('articleBody');
    if(!body || typeof slug !== 'string' || typeof title !== 'string') return;
    articleStarted = true;
    const parameters = {article_slug:slug, article_title:title};
    window.gtag('event', 'article_view', parameters);

    const milestones = [
      [25, 'article_25'], [50, 'article_50'], [75, 'article_75'],
      [90, 'article_90'], [100, 'article_complete']
    ];
    const sent = new Set();
    let frame = 0;
    let observer;

    function stop(){
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', schedule);
      observer?.disconnect();
      if(frame) cancelAnimationFrame(frame);
      frame = 0;
    }

    function check(){
      frame = 0;
      if(document.visibilityState !== 'visible') return;
      const rect = body.getBoundingClientRect();
      if(rect.height <= 0) return;
      // The furthest visible point within the Markdown body, excluding its
      // heading/navigation/footer. Short articles can be fully visible at once.
      const progress = Math.max(0, Math.min(100, (window.innerHeight - rect.top) / rect.height * 100));
      for(const [percent, name] of milestones){
        if(progress + 0.001 >= percent && !sent.has(name)){
          sent.add(name);
          window.gtag('event', name, parameters);
        }
      }
      if(sent.size === milestones.length) stop();
    }

    function schedule(){
      if(sent.size !== milestones.length && !frame) frame = requestAnimationFrame(check);
    }

    window.addEventListener('scroll', schedule, {passive:true});
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    if(window.ResizeObserver){
      observer = new ResizeObserver(schedule);
      observer.observe(body);
    }
    schedule();
  });
})();
