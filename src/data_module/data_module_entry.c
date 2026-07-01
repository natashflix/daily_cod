#include <stdio.h>
#include <stdlib.h>

#include "../data_libs/data_process/data_process.h"

int main(void) {
  int n;
  if (scanf("%d", &n) != 1 || n <= 0) return 1;

  double *data = malloc((size_t)n * sizeof(double));
  double *norm = malloc((size_t)n * sizeof(double));
  if (data == NULL || norm == NULL) {
    free(data);
    free(norm);
    return 1;
  }

  for (int i = 0; i < n; i++) {
    if (scanf("%lf", &data[i]) != 1) {
      free(data);
      free(norm);
      return 1;
    }
  }

  normalize(data, norm, (size_t)n);

  for (int i = 0; i < n; i++) {
    printf("%.2f", norm[i]);
    if (i + 1 < n) printf(" ");
  }
  printf("\n");

  free(data);
  free(norm);
  return 0;
}
