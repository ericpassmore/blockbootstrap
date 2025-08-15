<script lang="ts">
	let { data } = $props();
	let isVerified = $state(false);

	// Simulate verification process based on data received
	if (data.codeOk && data.status === 200) {
		isVerified = true;
		if (typeof window !== 'undefined' && data.token) {
			// Set a local store variable
			localStorage.setItem('token', data.token);
			// Redirect after 2.5 seconds
			setTimeout(() => {
				window.location.href = '/'; // Change to your target route
			}, 2500);
		}
	}
</script>

<div class="verify-container">
	<h1>Email Verification</h1>
	{#if isVerified}
		<p class="success-message">
			Verification successful! Redirecting to the main page...
			<a href="/" class="home-link"> 🏠 Back to Home </a>
		</p>
	{:else}
		<p class="error-message">
			{data.error}
			<a href="/" class="home-link"> 🏠 Back to Home </a>
		</p>
	{/if}
</div>
