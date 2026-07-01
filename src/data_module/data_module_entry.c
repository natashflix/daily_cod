#include <stdio.h>
#include <stdlib.h>

#include "../data_libs/data_io.h"
#include "../data_libs/data_stat.h"

int main(void) {
  int n;
  if (scanf("%d", &n) != 1 || n <= 0) return 1;

  double *data = malloc((size_t)n * sizeof(double));
  double *result = malloc((size_t)n * sizeof(double));
  if (data == NULL || result == NULL) {
    free(data);
    free(result);
    return 1;
  }

  input(data, n);

  /* Min-max normalization into [0, 1] reusing data_stat's min()/max(). */
  double lo = min(data, n);
  double hi = max(data, n);
  double range = hi - lo;
  for (int i = 0; i < n; i++) {
    result[i] = (range == 0.0) ? 0.0 : (data[i] - lo) / range;
  }

  output(result, n);

  free(data);
  free(result);
  return 0;
}
