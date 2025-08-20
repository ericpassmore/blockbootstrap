<script lang="ts">
	import { tick } from 'svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

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

			const reader = res.body?.getReader();
			if (!reader) return;

			const decoder = new TextDecoder();
			let partial = '';
			let html_partial = '';

			// start a new response slot
			apiResponse = [...apiResponse, ''];

			let lastUpdate = performance.now();
			const UPDATE_INTERVAL = 150; // ms — tweak this

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				partial += decoder.decode(value, { stream: true });
				html_partial = DOMPurify.sanitize(await marked(partial));
				const now = performance.now();

				if (now - lastUpdate > UPDATE_INTERVAL) {
					apiResponse[apiResponse.length - 1] = html_partial;
					await tick(); // let Svelte re-render
					lastUpdate = now;
				}
			}

			// flush at the end, update UI with final text
			partial += decoder.decode();
			html_partial = DOMPurify.sanitize(await marked(partial));
			apiResponse[apiResponse.length - 1] = html_partial;
			await tick();
		} catch (err) {
			console.error('Error calling API:', err);
		} finally {
			await tick(); // let Svelte re-render
			// Clear the textarea and reset height
			inputValue = '';
			adjustHeight();
		}
	}

	$effect(() => adjustHeight());
</script>

<h1>AI Assistant</h1>

{#if apiResponse.length > 0}
	<div class="response-container">
		<!-- eslint-disable-next-line svelte/require-each-key -->
		{#each apiResponse as response}
			<!-- been purified by DOMPurify -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class="response-block">{@html response}</div>
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
