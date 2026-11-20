const principles = [
  {
    number: "01",
    title: "Start with prerequisites",
    description:
      "Courses and their requirements form a graph, so a path respects what needs to come first.",
  },
  {
    number: "02",
    title: "Compare the trade-offs",
    description:
      "The optimizer tracks study hours and difficulty separately instead of hiding them in one score.",
  },
  {
    number: "03",
    title: "Choose what fits",
    description:
      "Compare faster and less-difficult options, then decide which trade-off works for you.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a aria-label="Paretoium home" className="wordmark" href="#">
          <span aria-hidden="true" className="wordmark-mark">
            p
          </span>
          paretoium
        </a>
        <nav aria-label="Main navigation" className="main-nav">
          <a href="#approach">Our approach</a>
          <a className="nav-cta" href="#optimizer">
            Meet the optimizer <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section aria-labelledby="hero-title" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span aria-hidden="true" className="eyebrow-dot" />
            A course path optimizer
          </p>
          <h1 id="hero-title">
            Your next step
            <br />
            <span>starts with a plan.</span>
          </h1>
          <p className="hero-description">
            Plan a route through your courses with prerequisites in mind.
            Paretoium compares study time and difficulty to help you see the
            trade-offs—not just one black-box answer.
          </p>
          <a className="button button-primary" href="#approach">
            See how it works <span aria-hidden="true">↓</span>
          </a>
        </div>

        <aside aria-label="What the optimizer does" className="optimizer-card" id="optimizer">
          <div className="card-topline">
            <span className="card-kicker">THE ENGINE</span>
            <span className="status-pill">
              <span aria-hidden="true" />
              Go · available
            </span>
          </div>
          <h2>More than one way forward.</h2>
          <p>
            The Go engine checks prerequisite graphs and finds paths that
            balance two goals.
          </p>
          <div className="objective-list">
            <div className="objective-row">
              <span className="objective-icon hours-icon" aria-hidden="true">
                ↗
              </span>
              <span>
                <strong>Study time</strong>
                <small>Find a faster route</small>
              </span>
            </div>
            <div className="objective-row">
              <span className="objective-icon difficulty-icon" aria-hidden="true">
                ◒
              </span>
              <span>
                <strong>Difficulty</strong>
                <small>Find a gentler route</small>
              </span>
            </div>
          </div>
          <div className="card-footnote">
            <span aria-hidden="true">✳</span>
            Results are calculated by explicit, testable rules.
          </div>
        </aside>
        <span aria-hidden="true" className="hero-spark hero-spark-one">
          ✳
        </span>
        <span aria-hidden="true" className="hero-spark hero-spark-two">
          ✳
        </span>
      </section>

      <section aria-labelledby="approach-title" className="approach" id="approach">
        <div className="section-heading">
          <p className="eyebrow">A clearer way to decide</p>
          <h2 id="approach-title">
            You bring the goals.
            <br />
            <span>We map the options.</span>
          </h2>
        </div>
        <div className="principle-list">
          {principles.map((principle) => (
            <article className="principle" key={principle.number}>
              <span className="principle-number">{principle.number}</span>
              <div>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Project status" className="status-banner">
        <div>
          <p className="eyebrow">Built in the open</p>
          <h2>The optimizer is ready. The web experience is growing.</h2>
        </div>
        <p>
          This is the web foundation. Course maps and Gemini-powered study
          features are planned for later.
        </p>
      </section>

      <footer className="site-footer">
        <a className="wordmark footer-wordmark" href="#">
          <span aria-hidden="true" className="wordmark-mark">
            p
          </span>
          paretoium
        </a>
        <p>Make your next learning move with clarity.</p>
      </footer>
    </main>
  );
}
