export function parseRating(value) {
    if (value == null || value === '') return NaN;
    return parseFloat(String(value).trim().replace(',', '.'));
}
