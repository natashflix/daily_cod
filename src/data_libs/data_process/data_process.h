#ifndef DATA_PROCESS_H
#define DATA_PROCESS_H

#include <stddef.h>

/* Min-max normalization: maps every element of src into the [0, 1] range and
 * writes the result into dst. If all values are equal (zero range) the whole
 * output is filled with zeroes. src and dst must hold at least n elements. */
void normalize(const double *src, double *dst, size_t n);

#endif /* DATA_PROCESS_H */
