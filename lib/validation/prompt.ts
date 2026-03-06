export function validatePromptItems(
  items: Array<{ concept: string; prompt_text: string }>
): {
  valid: boolean;
  errors: Array<{ index: number; message: string }>;
} {
  const errors: Array<{ index: number; message: string }> = [];
  const concepts = new Set<string>();

  items.forEach((item, index) => {
    // Check for duplicate concepts
    if (concepts.has(item.concept)) {
      errors.push({
        index,
        message: `Duplicate concept: "${item.concept}"`,
      });
    }
    concepts.add(item.concept);

    // Check for empty prompt_text
    if (!item.prompt_text || item.prompt_text.trim().length === 0) {
      errors.push({
        index,
        message: "Prompt text is required",
      });
    }

    // Check for prompt_text < 10 characters
    if (item.prompt_text && item.prompt_text.trim().length < 10) {
      errors.push({
        index,
        message: "Prompt text must be at least 10 characters",
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
