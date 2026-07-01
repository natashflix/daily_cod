#ifndef DATA_PROCESS_H
#define DATA_PROCESS_H

/* Min-max normalization: writes into result each element of data rescaled to
 * the [0, 1] range as (x - min) / (max - min). If every value is the same
 * (zero range) the whole result is filled with zeroes. */
void normalize(double *data, double *result, int n);

#endif
