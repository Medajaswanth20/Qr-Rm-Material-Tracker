export function copyToClipboard(text: string): void {
  if (!navigator?.clipboard) {
    console.warn('Clipboard API not available');
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    // Optionally, you could show a toast or visual feedback here.
    console.log('Copied to clipboard');
  }).catch((err) => {
    console.error('Failed to copy text: ', err);
  });
}
