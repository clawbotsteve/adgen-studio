export type BatchValidationResult = {
  valid: boolean;
  errors: string[]; // Hard blocks
  warnings: string[]; // Soft warnings
};

export function validateBatchCreate(payload: {
  clientId: string | null;
  profileId: string | null;
  promptPackId: string | null;
  promptItemCount: number;
  hasReferenceImage: boolean;
  profileMode?: string;
  audioEnabled?: boolean;
}): BatchValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Hard blocks (errors)
  if (!payload.clientId) {
    errors.push("Client is required");
  }

  if (!payload.profileId) {
    errors.push("Profile is required");
  }

  if (!payload.promptPackId) {
    errors.push("Prompt pack is required");
  }

  if (!payload.hasReferenceImage) {
    errors.push("At least one reference image is required");
  }

  if (payload.promptItemCount === 0) {
    errors.push("Prompt pack cannot be empty");
  }

  // Soft warnings
  if (payload.promptItemCount > 200) {
    warnings.push(
      `Large batch size (${payload.promptItemCount} items) may take a while to process`
    );
  }

  if (payload.audioEnabled && payload.profileMode === "video") {
    warnings.push("Audio generation on video profiles may impact processing time");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
