#include <stdio.h>

#include "s21_string.h"

void s21_strlen_test(void) {
  printf("=== s21_strlen_test ===\n");

  /* normal value */
  const char *s1 = "hello";
  size_t r1 = s21_strlen(s1);
  printf("input: \"%s\" | output: %zu | expected: 5 | %s\n", s1, r1,
         r1 == 5 ? "SUCCESS" : "FAIL");

  /* edge value: empty string */
  const char *s2 = "";
  size_t r2 = s21_strlen(s2);
  printf("input: \"\" | output: %zu | expected: 0 | %s\n", r2,
         r2 == 0 ? "SUCCESS" : "FAIL");

  /* value with spaces and special characters */
  const char *s3 = "a b c\n";
  size_t r3 = s21_strlen(s3);
  printf("input: \"a b c\\n\" | output: %zu | expected: 6 | %s\n", r3,
         r3 == 6 ? "SUCCESS" : "FAIL");

  /* longer value */
  const char *s4 = "1234567890";
  size_t r4 = s21_strlen(s4);
  printf("input: \"%s\" | output: %zu | expected: 10 | %s\n", s4, r4,
         r4 == 10 ? "SUCCESS" : "FAIL");
}

int main(void) {
  s21_strlen_test();
  return 0;
}
