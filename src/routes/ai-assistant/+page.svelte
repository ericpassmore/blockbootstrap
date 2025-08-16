<script lang="ts">
	import { tick } from 'svelte';

	let inputValue: string = $state('');
	let textareaElement: HTMLTextAreaElement;

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

	function handleSubmit() {
		// Placeholder for the function to call on Enter
		console.log('Enter pressed, submitting:', inputValue);
		// Clear the textarea and reset height
		inputValue = '';
		adjustHeight();
	}

	$effect(() => adjustHeight());
</script>

<h1>AI Assitant</h1>

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
</style>
