#include "data_stat.h"

double max(double *data, int n) {
  double m = data[0];
  for (int i = 1; i < n; i++)
    if (data[i] > m) m = data[i];
  return m;
}

double min(double *data, int n) {
  double m = data[0];
  for (int i = 1; i < n; i++)
    if (data[i] < m) m = data[i];
  return m;
}

double mean(double *data, int n) {
  double sum = 0.0;
  for (int i = 0; i < n; i++) sum += data[i];
  return sum / n;
}

double variance(double *data, int n) {
  double mu = mean(data, n);
  double sum = 0.0;
  for (int i = 0; i < n; i++) {
    double diff = data[i] - mu;
    sum += diff * diff;
  }
  return sum / n;
}
