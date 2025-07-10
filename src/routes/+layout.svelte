<nav>
	<a href="/tools">Tools</a>
	<a href="/methodology">Methodology</a>
</nav>

<main>
  <slot />
</main>

<footer>
  &copy; {new Date().getFullYear()} 
  <br>
  This project is licensed under the MIT License 
  <br>
  <a
    href="https://github.com/ericpassmore/blockbootstrap"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="GitHub Repository"
    style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none;"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.6-3.9-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.9 1.3 3.6 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.4 1.2-3.2-.1-.3-.6-1.6.1-3.3 0 0 1-.3 3.4 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.4-1.6 3.4-1.2 3.4-1.2.7 1.7.2 3 .1 3.3.8.8 1.2 1.9 1.2 3.2 0 4.4-2.7 5.4-5.3 5.7.4.3.8 1 .8 2v3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.65 18.35.5 12 .5z"
      />
    </svg>
    <span>GitHub</span>
  </a>
</footer>
