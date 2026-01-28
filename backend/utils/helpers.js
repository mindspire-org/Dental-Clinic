const paginate = (query, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    return query.skip(skip).limit(limit);
};

const getPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);

    return {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};

const formatResponse = (data, message = 'Success') => {
    return {
        status: 'success',
        message,
        data,
    };
};

const formatError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

module.exports = {
    paginate,
    getPaginationMeta,
    formatResponse,
    formatError,
};
