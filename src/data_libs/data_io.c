#include "data_io.h"

#include <stdio.h>

void input(double *data, int n) {
  for (int i = 0; i < n; i++) {
    if (scanf("%lf", &data[i]) != 1) data[i] = 0.0;
  }
}

void output(double *data, int n) {
  for (int i = 0; i < n; i++) {
    printf("%.2f", data[i]);
    if (i + 1 < n) printf(" ");
  }
  printf("\n");
}
