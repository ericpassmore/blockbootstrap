<script lang="ts">
	import { goto } from '$app/navigation';
	let { data } = $props();
	let isVerified = $state(false);

	// Simulate verification process based on data received
	if (data.codeOk && data.status === 200) {
		isVerified = true;
		if (typeof window !== 'undefined' && data.token ) {
			// Set a local store variable
			localStorage.setItem('token', data.token);
		}
	}
</script>

<div class="verify-container">
	<h1>Email Verification</h1>
	{#if isVerified}
		<p class="success-message">Verification successful! Redirecting to the main page...</p>
	{:else}
		<p class="error-message">{data.error}</p>
	{/if}
</div>

<style>
	.verify-container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		text-align: center;
		background-color: #fff;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	h1 {
		color: #007bff;
		margin-bottom: 1.5rem;
	}

	.error-message {
		color: #dc3545;
		font-weight: bold;
	}
</style>
