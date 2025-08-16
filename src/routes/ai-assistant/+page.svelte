<script lang="ts">
	import { tick } from 'svelte';
	import { onMount } from 'svelte';

	let inputValue: string = $state('');
	let textareaElement: HTMLTextAreaElement;
	let apiResponse: string[] = $state([]);

	async function adjustHeight() {
		if (textareaElement) {
			await tick();
			textareaElement.style.height = 'auto';
			textareaElement.style.height = textareaElement.scrollHeight + 'px';
		}
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			// Call the function on Enter key press
			handleSubmit();
		}
	}

	async function handleSubmit() {
		if (!inputValue.trim()) return;

		try {
			const res = await fetch('/api/agent/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ query: inputValue })
			});

			const text = await res.text(); // since server returns plain text
			apiResponse.push(text);
		} catch (err) {
			console.error('Error calling API:', err);
		}
		// Clear the textarea and reset height
		inputValue = '';
		adjustHeight();
	}

	$effect(() => adjustHeight());
</script>

<h1>AI Assitant</h1>

{#if apiResponse.length > 0}
	<div class="response-container">
		{#each apiResponse as response}
			<div class="info-block">{response}</div>
		{/each}
	</div>
{/if}

<textarea
	class="expanding-textarea"
	bind:this={textareaElement}
	bind:value={inputValue}
	rows="1"
	placeholder="Type your text here..."
	oninput={adjustHeight}
	onkeydown={onKeyDown}
></textarea>

<style>
	.expanding-textarea {
		width: 60ch;
		border-radius: 8px;
		background-color: var(--secondary-background-color);
		color: var(--secondary-foreground-color);
		font-family: inherit;
		font-size: 1rem;
		padding: 0.5rem;
		border: none;
		resize: none;
		overflow: hidden;
		box-sizing: border-box;
	}

	.response-container {
		display: block;
		margin-bottom: 1rem;
	}

	.info-block {
		background-color: var(--secondary-background-color);
		color: var(--secondary-foreground-color);
		padding: 1rem;
		border-radius: 8px;
		white-space: pre-wrap;
		font-family: inherit;
		font-size: 1rem;
	}
</style>
