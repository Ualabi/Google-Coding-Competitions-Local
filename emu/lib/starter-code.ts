export type Language = "python" | "cpp";

export function buildStarterCode(
  problemTitle: string,
  language: Language,
): string {
  if (language === "cpp") {
    return `// ${problemTitle}
#include <bits/stdc++.h>
using namespace std;

int main() {
    int t;
    cin >> t;

    for (int tc = 1; tc <= t; ++tc) {
        // Read input and solve the test case here.

        cout << "Case #" << tc << ": " << "" << "\\n";
    }

    return 0;
}
`;
  }

  return `# ${problemTitle}
import sys

def solve(case_number: int) -> str:
    # Read input and solve the test case here.
    return ""


def main() -> None:
    data = sys.stdin.read().split("\\n")
    t = int(data[0])

    for tc in range(1, t + 1):
        print(f"Case #{tc}: {solve(tc)}")


if __name__ == "__main__":
    main()
`;
}
