#include <stdio.h>
#include <stdlib.h>

#include "../data_libs/data_io.h"
#include "../data_libs/data_process.h"

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
  normalize(data, result, n);
  output(result, n);

  free(data);
  free(result);
  return 0;
}
