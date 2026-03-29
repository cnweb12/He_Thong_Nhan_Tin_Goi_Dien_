function mapMongoError(error) {
  if (error?.code === 11000) {
    return {
      statusCode: 409,
      message: "Duplicate data",
      details: error.keyValue || null,
    };
  }

  if (error?.name === "ValidationError") {
    return {
      statusCode: 400,
      message: error.message,
      details: error.errors || null,
    };
  }

  if (error?.name === "CastError") {
    return {
      statusCode: 400,
      message: "Invalid id format",
      details: {
        path: error.path,
        value: error.value,
      },
    };
  }

  return {
    statusCode: 500,
    message: "Database error",
    details: null,
  };
}

module.exports = {
  mapMongoError,
};
