function validateSendMessageRequest(req) {
  const errors = [];
  const body = req.body || {};
  const { conversationId, type = "text", text, clientMessageId, attachments } = body;

  if (!conversationId || typeof conversationId !== "string" || conversationId.trim().length === 0) {
    errors.push({ field: "conversationId", message: "Conversation ID is required" });
  }

  if (type !== undefined && !["text", "image", "file", "system"].includes(type)) {
    errors.push({ field: "type", message: "Message type must be one of: text, image, file, system" });
  }

  if (clientMessageId !== undefined && (typeof clientMessageId !== "string" || clientMessageId.trim().length === 0)) {
    errors.push({ field: "clientMessageId", message: "Client message ID must be a non-empty string" });
  }

  if (attachments !== undefined) {
    if (!Array.isArray(attachments)) {
      errors.push({ field: "attachments", message: "Attachments must be an array" });
    } else {
      attachments.forEach((attachment, index) => {
        if (!attachment || typeof attachment !== "object") {
          errors.push({ field: `attachments[${index}]`, message: "Attachment must be an object" });
          return;
        }

        if (!attachment.fileName || typeof attachment.fileName !== "string") {
          errors.push({ field: `attachments[${index}].fileName`, message: "Attachment fileName is required" });
        }

        if (!attachment.url || typeof attachment.url !== "string") {
          errors.push({ field: `attachments[${index}].url`, message: "Attachment url is required" });
        }
      });
    }
  }

  const trimmedText = typeof text === "string" ? text.trim() : "";
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  if (type === "text" && !trimmedText) {
    errors.push({ field: "text", message: "Text content is required for text messages" });
  }

  if ((type === "image" || type === "file") && !hasAttachments) {
    errors.push({ field: "attachments", message: "Attachments are required for image or file messages" });
  }

  if (type === "system" && !trimmedText) {
    errors.push({ field: "text", message: "Text content is required for system messages" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateGetConversationMessagesRequest(req) {
  const errors = [];
  const { conversationId } = req.params || {};
  const { limit, beforeSeq } = req.query || {};

  if (!conversationId || typeof conversationId !== "string" || conversationId.trim().length === 0) {
    errors.push({ field: "conversationId", message: "Conversation ID is required" });
  }

  if (limit !== undefined) {
    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      errors.push({ field: "limit", message: "Limit must be an integer between 1 and 100" });
    }
  }

  if (beforeSeq !== undefined) {
    const parsedBeforeSeq = Number(beforeSeq);
    if (!Number.isInteger(parsedBeforeSeq) || parsedBeforeSeq < 1) {
      errors.push({ field: "beforeSeq", message: "beforeSeq must be an integer greater than 0" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateSendMessageRequest,
  validateGetConversationMessagesRequest,
};
