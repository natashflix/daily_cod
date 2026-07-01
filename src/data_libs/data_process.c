#include "data_process.h"

#include "data_stat.h"

void normalize(double *data, double *result, int n) {
  double lo = min(data, n);
  double hi = max(data, n);
  double range = hi - lo;
  for (int i = 0; i < n; i++) {
    result[i] = (range == 0.0) ? 0.0 : (data[i] - lo) / range;
  }
}
