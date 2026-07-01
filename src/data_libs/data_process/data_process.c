#include "data_process.h"

void normalize(const double *src, double *dst, size_t n) {
  if (n == 0) return;

  double min = src[0];
  double max = src[0];
  for (size_t i = 1; i < n; i++) {
    if (src[i] < min) min = src[i];
    if (src[i] > max) max = src[i];
  }

  double range = max - min;
  for (size_t i = 0; i < n; i++) {
    dst[i] = (range == 0.0) ? 0.0 : (src[i] - min) / range;
  }
}
