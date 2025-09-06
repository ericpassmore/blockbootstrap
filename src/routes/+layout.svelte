<script lang="ts">
	let { children } = $props(); // Access the children prop
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	let isLoginPopoverOpen = $state(false);
	let emailSubmissionSuccessfull = $state(false);
	let message: string = $state('');

	// Track login state
	// eslint-disable-next-line svelte/prefer-writable-derived
	let isLoggedIn = $state(false);

	// Check localStorage for token when component loads
	$effect(() => {
		isLoggedIn = !!localStorage.getItem('token');
	});

	// Optional: expose a logout handler
	function handleLoginButtonClick() {
		if (isLoggedIn) {
			// Logout logic: remove token and update state
			localStorage.removeItem('token');
			isLoggedIn = false;
		} else {
			// Open login popover
			isLoginPopoverOpen = true;
		}
	}

	function closePopup() {
		isLoginPopoverOpen = false;
		message = '';
		emailSubmissionSuccessfull = false;
	}

	function handleNavSelection(event: Event) {
		const selectElement = event.target as HTMLSelectElement;
		window.location.href = selectElement.value;
	}

	const goatcounterUrl = 'https://blockbootstrap.goatcounter.com/count';

	onMount(() => {
		// Load the GoatCounter script dynamically
		const script = document.createElement('script');
		script.src = '//gc.zgo.at/count.js';
		script.async = true;
		script.setAttribute('data-goatcounter', goatcounterUrl);
		document.body.appendChild(script);

		// Track SPA navigations
		afterNavigate(() => {
			if (window.goatcounter) {
				window.goatcounter.count();
			}
		});
	});
</script>

<nav>
	<a href={resolve('/')} class="nav-home-link">
		<img src="/logo_b_halo.svg" alt="BlockBootstrap Logo" />
		Home
	</a>
	<div class="nav-links">
		<a href={resolve('/builder')}>Portfolio Builder</a>
		<a href={resolve('/inspect/1')}>Inspect Block</a>
		<a href={resolve('/methodology')}>Methodology</a>
		<a href={resolve('/privacy')}>Privacy</a>
		<a href={resolve('/userguide')}>User Guide</a>
	</div>
	<button
		class={isLoggedIn ? 'logout-button' : 'login-button'}
		id="login-button"
		onclick={handleLoginButtonClick}
	>
		<span class="material-icons">person</span>
		{isLoggedIn ? 'Logout' : 'Login'}
	</button>
	<select id="nav-dropdown" class="nav-dropdown" onchange={handleNavSelection}>
		<option value="/">Home</option>
		<option value="/builder">Portfolio Builder</option>
		<option value="/inspect/1">Inspect Block</option>
		<option value="/methodology">Methodology</option>
		<option value="/privacy">Privacy</option>
		<option value="/userguide">User Guide</option>
	</select>
</nav>

<main>
	{@render children()}
</main>

{#if isLoginPopoverOpen}
	<div class="popup-overlay">
		<div class="popup-content">
			<h2>Login</h2>
			<form
				method="POST"
				action="/?/login"
				use:enhance={() => {
					return async ({ update, result }) => {
						await update({ reset: false });
						// Clear old message
						message = '';
						if (result.type === 'success') {
							emailSubmissionSuccessfull = true;
							message = 'Check your email for the verification code.';
						} else if (result.type === 'failure') {
							message = (result.data?.error as string) || 'Unknown error.';
						}
						if (message) {
							setTimeout(closePopup, 2500);
						}
					};
				}}
			>
				<div class="form-group">
					<label for="email">Email Address</label>
					<input type="email" id="email" name="email" required />
				</div>

				{#if message}
					{#if emailSubmissionSuccessfull}
						<div class="form-success-message">{message}</div>
					{:else}
						<div class="form-error-message">{message}</div>
					{/if}
				{/if}

				<button type="submit">Submit</button>
				<button type="button" onclick={() => (isLoginPopoverOpen = false)}>Cancel</button>
			</form>
		</div>
	</div>
{/if}

<footer>
	&copy; {new Date().getFullYear()}
	<br />
	This project is licensed under the MIT License
	<br />
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
