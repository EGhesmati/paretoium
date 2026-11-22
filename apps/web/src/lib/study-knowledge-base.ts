import type { QuizQuestion, StudyGuide } from "./ai-study";

export interface TopicBlueprint {
  codeMatch?: string[];
  keywords: string[];
  guide: StudyGuide;
  quiz: QuizQuestion[];
}

export const TOPIC_BLUEPRINTS: TopicBlueprint[] = [
  {
    codeMatch: ["CS101"],
    keywords: ["intro to computer science", "programming fundamentals", "python", "variables", "recursion"],
    guide: {
      overview:
        "Intro to Computer Science teaches how programs represent state in memory, transform data using control flow and recursion, and scale predictably via asymptotic complexity (Big-O).",
      keyConcepts: [
        {
          term: "Call Stack vs. Heap Memory",
          explanation:
            "Function calls push isolated stack frames (parameters, locals, return address) in O(1) time, while dynamically sized objects live on the heap and are shared by reference.",
        },
        {
          term: "Loop Invariants",
          explanation:
            "A boolean condition that holds before, during, and after each loop iteration, proving that an algorithm like Binary Search terminates with the right index.",
        },
        {
          term: "Recursion & Base Cases",
          explanation:
            "Decomposing a problem of size N into strictly smaller subproblems (e.g., N-1 or N/2) until reaching a non-recursive base case.",
        },
        {
          term: "Big-O Time & Space Complexity",
          explanation:
            "Quantifies how runtime and auxiliary memory scale as input size N grows: O(1) < O(log N) < O(N) < O(N log N) < O(N^2).",
        },
        {
          term: "Two's Complement & IEEE-754 Floats",
          explanation:
            "Integers use two's complement so addition and subtraction share hardware circuits; floats use sign/exponent/mantissa bits and require epsilon comparisons.",
        },
      ],
      mentalModel:
        "Picture a program as a sequence of stack frames reading and mutating cells in memory: every loop needs a progress measure toward termination, and every function should uphold a clear input-to-output contract.",
      workedExample: `// Binary Search with explicit Loop Invariant — O(log N) time, O(1) space
function binarySearch(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length - 1;
  // Invariant: if target is present, its index is always inside [lo, hi]
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1); // avoids (lo + hi) overflow
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
      commonPitfalls: [
        "Updating lo = mid instead of lo = mid + 1 in binary search, causing an infinite loop when lo + 1 === hi.",
        "Mutating a passed array or object in-place without realizing the caller holds a reference to the same heap object.",
        "Comparing floating-point numbers with === (e.g., 0.1 + 0.2 === 0.3 is false) instead of Math.abs(a - b) < 1e-9.",
        "Writing recursive functions whose recursive call does not shrink the input toward the base case (causing StackOverflow).",
      ],
      practiceTask:
        "Implement a recursive-descent arithmetic expression evaluator supporting +, -, *, /, parentheses, and unary minus, along with unit tests for operator precedence and division-by-zero errors.",
      modules: [
        {
          title: "Page 1 · Memory Model: Stack Frames, Heap & Data Representation",
          summary:
            "How variables, primitive types, pointers, and function activation records actually live in computer memory.",
          sections: [
            {
              heading: "Stack Frames & Lexical Scope",
              body: "Every time a function is invoked, the runtime allocates a contiguous activation record (stack frame) holding its arguments and local variables. When the function returns, the stack pointer moves back in a single CPU instruction.",
            },
            {
              heading: "Heap Objects & Reference Aliasing",
              body: "Arrays, strings, and structs allocated dynamically reside in the heap. Passing an object to a function copies its 64-bit memory address (reference), meaning in-place mutations are visible to the caller.",
            },
            {
              heading: "Binary Integers & Floating-Point Precision",
              body: "A 32-bit signed int ranges from -2,147,483,648 to 2,147,483,647 in two's complement. IEEE-754 double-precision floats have 53 bits of significand (~15–17 decimal digits), so base-10 fractions like 0.1 are repeating binary fractions.",
            },
          ],
          codeOrFormula: `// Reference Aliasing vs. Defensive Copy
const original = [10, 20, 30];
const alias = original;          // points to the SAME heap array
const copy = [...original];      // allocates a NEW heap array
alias[0] = 99;
// original[0] is now 99, while copy[0] remains 10`,
          takeaways: [
            "Primitive values copy by value; heap structures copy their reference address.",
            "Use Math.abs(a - b) < 1e-9 when testing floating-point equality.",
            "Watch for 32-bit integer overflow when adding large indices: use lo + ((hi - lo) >> 1).",
          ],
        },
        {
          title: "Page 2 · Control Flow, Loop Invariants & Recursion",
          summary:
            "Writing provably correct loops and recursive functions that always terminate and handle boundary inputs.",
          sections: [
            {
              heading: "Three Parts of a Loop Invariant Proof",
              body: "1. Initialization: the invariant holds before the first iteration. 2. Maintenance: if it holds at the start of an iteration, it holds at the end. 3. Termination: the loop counter reaches the exit condition, and invariant + exit condition proves the result.",
            },
            {
              heading: "Divide-and-Conquer Recursion",
              body: "Instead of stepping from N to N-1 (O(N) depth), divide-and-conquer splits N into N/2 at each call, reaching the base case in log2(N) stack frames (e.g., Merge Sort, Fast Exponentiation).",
            },
          ],
          codeOrFormula: `// Fast Exponentiation by Squaring — O(log n) multiplications
function power(base: number, exp: number): number {
  if (exp === 0) return 1;
  const half = power(base, Math.floor(exp / 2));
  return exp % 2 === 0 ? half * half : base * half * half;
}`,
          takeaways: [
            "Every recursion must have a reachable base case and a strictly shrinking measure.",
            "Halving the problem size at each step reduces O(N) linear work to O(log N).",
            "Always test N = 0 (empty), N = 1 (single element), and all-duplicate inputs.",
          ],
        },
        {
          title: "Page 3 · Asymptotic Complexity (Big-O) & Sorting Walkthrough",
          summary:
            "Analyzing how nested loops, binary search, and merge sort scale from N = 100 to N = 10,000,000.",
          sections: [
            {
              heading: "Why O(N log N) Beats O(N^2)",
              body: "At N = 1,000,000 elements, Insertion Sort (O(N^2)) performs ~500 billion comparisons (~10 minutes), whereas Merge Sort (O(N log N)) performs ~20 million comparisons (~15 milliseconds).",
            },
            {
              heading: "Two-Pointer & Hash-Set Optimization",
              body: "Replacing an inner linear scan O(N) with a hash-set lookup O(1) or sorted two-pointer walk collapses an O(N^2) pair-search down to O(N) or O(N log N).",
            },
          ],
          codeOrFormula: `// Two-Sum in O(N) time and O(N) space using a Hash Map
function twoSum(nums: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement)!, i];
    seen.set(nums[i], i);
  }
  return null;
}`,
          takeaways: [
            "Drop constant factors and lower-order terms when stating Big-O, but respect cache locality in practice.",
            "Hash maps trade O(N) memory to turn O(N) linear lookups into O(1) average lookups.",
            "Merge Sort guarantees O(N log N) worst-case time and stable ordering using O(N) auxiliary space.",
          ],
        },
        {
          title: "Page 4 · Edge Cases, Debugging & Expression Parser Lab",
          summary:
            "Common beginner/intermediate bugs and a step-by-step guide to building an arithmetic expression evaluator.",
          sections: [
            {
              heading: "Recursive-Descent Grammar for Arithmetic",
              body: "To respect operator precedence (* and / bind tighter than + and -), split the grammar into three levels: Expr -> Term ((+|-) Term)*, Term -> Factor ((*|/) Factor)*, and Factor -> Number | '(' Expr ')'.",
            },
            {
              heading: "Systematic Unit Testing",
              body: "Write table-driven tests covering normal expressions ('2 + 3 * 4' -> 14), parentheses ('(2 + 3) * 4' -> 20), left-associativity ('10 - 3 - 2' -> 5), and syntax errors.",
            },
          ],
          codeOrFormula: `// Recursive-Descent Precedence Sketch
// Expr   := Term (('+' | '-') Term)*
// Term   := Factor (('*' | '/') Factor)*
// Factor := NUMBER | '(' Expr ')' | '-' Factor`,
          takeaways: [
            "Encode operator precedence as distinct levels in your parser grammar.",
            "Left-associative operators (- and /) must be evaluated left-to-right in a loop, not right-recursively.",
            "Switch to the Practice Quiz tab to test your CS101 mastery.",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "Why do we compute the midpoint in binary search as `lo + ((hi - lo) >> 1)` and update `lo = mid + 1`?",
        options: [
          "To prevent 32-bit integer overflow on (lo + hi) and guarantee the search interval [lo, hi] strictly shrinks each step",
          "Because bitwise shifts convert floating-point numbers into strings",
          "To make binary search run in O(N^2) time instead of O(log N)",
          "Because arrays in memory cannot be indexed at index 0",
        ],
        correctIndex: 0,
        explanation:
          "Adding `lo + hi` directly can overflow 32-bit signed integers when the array has > 10^9 elements, and `lo = mid + 1` ensures we exclude the already-checked `mid` index so the loop cannot stall when `lo + 1 == hi`.",
        difficulty: "foundation",
      },
      {
        question: "An algorithm splits an array of size N into two halves, recursively processes both halves, and merges them in O(N) time. What is its time complexity?",
        options: ["O(log N)", "O(N)", "O(N log N)", "O(N^2)"],
        correctIndex: 2,
        explanation:
          "By the Master Theorem, T(N) = 2T(N/2) + O(N) has log2(N) recursion levels and performs O(N) total merge work per level, giving O(N log N).",
        difficulty: "applied",
      },
      {
        question: "What happens in memory when you pass an array `arr` into a function `mutate(arr)` that executes `arr[0] = 42`?",
        options: [
          "A full deep copy of the array is automatically created on the call stack",
          "The function receives a copy of the reference pointing to the same heap array, so the caller sees arr[0] === 42",
          "The compiler rejects the program because heap arrays are immutable",
          "Only the return address on the stack is modified",
        ],
        correctIndex: 1,
        explanation:
          "Arrays reside on the heap; passing an array passes its reference address by value, so mutating `arr[0]` modifies the shared heap element.",
        difficulty: "applied",
      },
      {
        question: "In a recursive-descent parser for arithmetic (`+`, `-`, `*`, `/`), why is `10 - 3 - 2` evaluated using a `while` loop at the `Expr` level rather than right-recursion `Term - Expr`?",
        options: [
          "Right-recursion would group it as `10 - (3 - 2) = 9` instead of left-associative `(10 - 3) - 2 = 5`",
          "Subtraction has higher precedence than multiplication",
          "While loops cannot call `parseTerm()`",
          "Parentheses are not allowed inside arithmetic expressions",
        ],
        correctIndex: 0,
        explanation:
          "Subtraction and division are left-associative: iterating in a `while` loop accumulates `((10 - 3) - 2) = 5`, whereas right-recursion evaluates from right to left.",
        difficulty: "challenge",
      },
    ],
  },
  {
    codeMatch: ["CS102"],
    keywords: ["data structures", "algorithms", "hash table", "heap", "dijkstra", "dynamic programming", "graph"],
    guide: {
      overview:
        "Data Structures & Algorithms connects memory layout to algorithmic speed: dynamic arrays, hash tables, binary heaps, balanced search trees, graph traversals (BFS/DFS/Topological Sort/Dijkstra), and dynamic programming.",
      keyConcepts: [
        {
          term: "Amortized O(1) Dynamic Array & Hash Resize",
          explanation:
            "Doubling capacity when full costs O(N) on resize steps, but geometric series summation (1 + 2 + 4 + ... + N <= 2N) keeps the average cost per insertion O(1).",
        },
        {
          term: "Binary Heap & Priority Queue",
          explanation:
            "An array-backed complete binary tree where parent(i) = (i-1)>>1 and children are 2i+1, 2i+2; supports O(1) min-peek, O(log N) push/pop, and O(N) bottom-up heapify.",
        },
        {
          term: "Topological Sort & DAG Cycle Detection",
          explanation:
            "Kahn's in-degree peeling and 3-color DFS order a Directed Acyclic Graph in O(V + E) time so every prerequisite appears before its dependents.",
        },
        {
          term: "Dijkstra's Shortest Path vs. Bellman-Ford",
          explanation:
            "Dijkstra greedily relaxes non-negative weighted edges via a min-heap in O((V + E) log V); negative edge weights require Bellman-Ford O(V * E).",
        },
        {
          term: "Dynamic Programming on State DAGs",
          explanation:
            "Caches solutions to overlapping subproblems with optimal substructure so exponential recursion collapses to polynomial table filling.",
        },
      ],
      mentalModel:
        "Choose the data structure by the invariant you need to maintain: contiguous arrays for cache-fast sequential access, hash maps for O(1) exact lookup, heaps for extremum extraction, and balanced trees for ordered range queries.",
      workedExample: `// Dijkstra's Shortest Path with Min-Priority Queue — O((V + E) log V)
function dijkstra(adj: Map<string, Array<{ to: string; w: number }>>, start: string) {
  const dist = new Map<string, number>([[start, 0]]);
  const pq: Array<[number, string]> = [[0, start]]; // [cost, node]

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift()!;
    if (d > (dist.get(u) ?? Infinity)) continue; // stale heap entry
    for (const edge of adj.get(u) ?? []) {
      const next = d + edge.w;
      if (next < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, next);
        pq.push([next, edge.to]);
      }
    }
  }
  return dist;
}`,
      commonPitfalls: [
        "Running Dijkstra's algorithm on a graph with negative edge weights (greedy finality fails when a later negative edge lowers a settled node's distance).",
        "Marking nodes visited when popping from the BFS queue instead of when pushing, causing duplicate queue blowup.",
        "Forgetting tombstone markers when deleting keys from an open-addressed linear-probing hash table.",
        "Iterating capacity forward instead of backward in 1D space-optimized 0/1 Knapsack (accidentally turning 0/1 Knapsack into Unbounded Knapsack).",
      ],
      practiceTask:
        "Implement an array-backed binary Min-Heap, Kahn's cycle-detecting topological sort, and Dijkstra's shortest-path solver, then benchmark them on a 1,000-node sparse graph.",
      modules: [
        {
          title: "Page 1 · Dynamic Arrays, Cache Locality & Hash Tables",
          summary:
            "How contiguous memory buffers and open-addressed hash tables achieve O(1) amortized performance.",
          sections: [
            {
              heading: "Why Doubling Capacity Is O(1) Amortized",
              body: "If an array resizes by +K (arithmetic growth), N insertions copy K + 2K + 3K + ... = O(N^2) elements. Doubling capacity (2^k) ensures resizes happen at powers of 2, totaling at most 2N element copies across N pushes.",
            },
            {
              heading: "Hash Collision Resolution: Chaining vs. Probing",
              body: "Separate chaining stores linked lists or small vectors per bucket. Open addressing (linear probing / Robin Hood hashing) stores all entries directly inside a flat array for superior CPU L1/L2 cache locality, provided load factor alpha = N/M <= 0.75.",
            },
          ],
          codeOrFormula: `// Open-Addressed Linear Probing Lookup with Tombstones
function findSlot(keys: (string | null)[], key: string): number {
  let idx = hash(key) & (keys.length - 1); // power-of-2 table mask
  while (keys[idx] !== null && keys[idx] !== key) {
    idx = (idx + 1) & (keys.length - 1);
  }
  return idx;
}`,
          takeaways: [
            "Geometric resizing (2x) gives O(1) amortized push; arithmetic resizing (+C) degrades to O(N^2).",
            "Never delete an open-addressed slot by setting it to null directly—insert a TOMBSTONE marker.",
            "Keep hash table capacity a power of 2 so modulo `h % M` becomes a single-cycle bitwise `h & (M - 1)`.",
          ],
        },
        {
          title: "Page 2 · Heaps, Balanced BSTs & Priority Scheduling",
          summary:
            "Array-indexed binary heaps, Floyd's O(N) heapify, and AVL/Red-Black tree height bounds.",
          sections: [
            {
              heading: "Binary Heap Invariant & O(N) BuildHeap",
              body: "A min-heap requires `heap[parent(i)] <= heap[i]` for every node. Building a heap bottom-up by sifting down from index `floor(N/2) - 1` down to `0` takes O(N) time because half the nodes are leaves (height 0) and a quarter are at height 1.",
            },
            {
              heading: "Balanced Search Trees (AVL & Red-Black)",
              body: "An unbalanced BST degrades to O(N) height when keys arrive sorted. AVL trees enforce `|height(L) - height(R)| <= 1` via single and double rotations, guaranteeing height <= 1.44 log2(N).",
            },
          ],
          codeOrFormula: `// Sift-Down in a 0-indexed Binary Min-Heap — O(log N)
function siftDown(h: number[], i: number): void {
  const n = h.length;
  while (true) {
    let smallest = i;
    const l = (i << 1) + 1;
    const r = (i << 1) + 2;
    if (l < n && h[l] < h[smallest]) smallest = l;
    if (r < n && h[r] < h[smallest]) smallest = r;
    if (smallest === i) break;
    [h[i], h[smallest]] = [h[smallest], h[i]];
    i = smallest;
  }
}`,
          takeaways: [
            "Floyd's bottom-up `buildHeap` is O(N); inserting N items one-by-one is O(N log N).",
            "Use a Min-Heap of size K to track the Top-K largest elements in a stream in O(N log K) time.",
            "Heaps do not support O(log N) arbitrary value search—pair with an index map if `decreaseKey` is needed.",
          ],
        },
        {
          title: "Page 3 · Graph Algorithms: BFS, DFS, Topo Sort & Dijkstra",
          summary:
            "Traversing graphs, detecting cycles, ordering prerequisite DAGs, and finding weighted shortest paths.",
          sections: [
            {
              heading: "Kahn's Algorithm vs. 3-Color DFS for DAGs",
              body: "Kahn's algorithm repeatedly pops nodes with `inDegree == 0` and decrements their neighbors' in-degrees. If fewer than V nodes are emitted, the remaining nodes contain a directed cycle.",
            },
            {
              heading: "Lazy Deletion in Dijkstra's Priority Queue",
              body: "Instead of implementing a complex `decreaseKey` heap operation, push a new `[newDist, v]` pair into the heap and ignore stale popped entries where `d > dist[u]`.",
            },
          ],
          codeOrFormula: `// 3-Color DFS Cycle Detection (0 = Unvisited, 1 = Visiting, 2 = Visited)
function hasCycle(u: number, adj: number[][], state: Uint8Array): boolean {
  state[u] = 1; // Gray (on active recursion stack)
  for (const v of adj[u]) {
    if (state[v] === 1) return true; // Back-edge to ancestor -> Cycle!
    if (state[v] === 0 && hasCycle(v, adj, state)) return true;
  }
  state[u] = 2; // Black (finished)
  return false;
}`,
          takeaways: [
            "A back-edge to a Gray (visiting) node in directed DFS proves a cycle exists.",
            "Lazy Dijkstra check `if (d > dist[u]) continue;` skips outdated heap entries in O(1).",
            "For graphs with 0/1 edge weights, 0-1 BFS with a double-ended deque runs in linear O(V + E) time.",
          ],
        },
        {
          title: "Page 4 · Dynamic Programming & Space Optimization",
          summary:
            "Turning recurrence relations into bottom-up tables and reconstructing optimal choices.",
          sections: [
            {
              heading: "0/1 Knapsack vs. Unbounded Knapsack",
              body: "In 1D space-compressed DP (`dp[w]`), iterating `w` from `W` down to `weight` ensures `dp[w - weight]` comes from the previous item's row (0/1 Knapsack). Iterating `w` upward from `weight` to `W` reuses the current item's row (Unbounded Knapsack).",
            },
            {
              heading: "Longest Common Subsequence (LCS) & Edit Distance",
              body: "Comparing prefixes `A[0..i]` and `B[0..j]` yields a 2D DAG where diagonal moves match/substitute characters and horizontal/vertical moves insert/delete.",
            },
          ],
          codeOrFormula: `// Coin Change (Minimum Coins to make amount A) — O(A * |coins|)
function minCoins(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (a >= c) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
          takeaways: [
            "Always define the state meaning (`dp[i]` = ...) and base cases (`dp[0]`) before writing loops.",
            "Reverse the inner capacity loop for 0/1 single-use items; go forward for unlimited-use items.",
            "Switch to the Practice Quiz tab to verify your CS102 mastery.",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "Why does Kahn's topological sort algorithm detect a cycle if the output list has fewer than V vertices?",
        options: [
          "Every vertex in a directed cycle has an in-degree >= 1 from another vertex in the cycle, so its in-degree never reaches 0",
          "Because Kahn's algorithm only works on undirected trees",
          "Because vertices with out-degree 0 are deleted first",
          "Because hash tables cannot store more than V keys",
        ],
        correctIndex: 0,
        explanation:
          "Nodes inside a cycle wait on each other's prerequisites forever, so none of them ever reaches `inDegree == 0` to enter the queue.",
        difficulty: "foundation",
      },
      {
        question: "What is the time complexity of building a binary heap from an unsorted array of N elements using Floyd's bottom-up `siftDown` method?",
        options: ["O(log N)", "O(N)", "O(N log N)", "O(N^2)"],
        correctIndex: 1,
        explanation:
          "Most nodes sit near the bottom of the tree (N/2 leaves do 0 work, N/4 nodes at height 1 do 1 swap, etc.), and the sum of `N / 2^(h+1) * h` converges to O(N).",
        difficulty: "applied",
      },
      {
        question: "Why does Dijkstra's algorithm fail on graphs with negative-weight edges?",
        options: [
          "Min-heaps cannot store negative numbers",
          "Dijkstra assumes that once the minimum-distance vertex u is popped, no future path through an unvisited vertex can lower dist[u]",
          "Adjacency lists only allow positive integers",
          "Negative edges always create an infinite loop even in a DAG",
        ],
        correctIndex: 1,
        explanation:
          "Dijkstra's greedy invariant relies on path costs growing monotonically; a negative edge later in the graph can make a longer path cheaper than an already-settled node.",
        difficulty: "applied",
      },
      {
        question: "In 1D space-optimized 0/1 Knapsack (`dp[w]`), what bug occurs if you iterate `w` forward from `item.weight` up to `W` instead of backward from `W` down to `item.weight`?",
        options: [
          "The array index goes out of bounds",
          "The same item can be picked multiple times in one pass, solving Unbounded Knapsack instead of 0/1 Knapsack",
          "The time complexity becomes O(2^N)",
          "All values in dp[] remain 0",
        ],
        correctIndex: 1,
        explanation:
          "When `w` increases left-to-right, `dp[w - item.weight]` has already been updated using the current item in the same outer iteration.",
        difficulty: "challenge",
      },
    ],
  },
  {
    codeMatch: ["CS201"],
    keywords: ["computer architecture", "assembly", "risc-v", "pipeline", "cache", "cpu", "registers"],
    guide: {
      overview:
        "Computer Architecture bridges software and silicon: Instruction Set Architectures (RISC-V / x86-64), the 5-stage pipelined datapath (IF, ID, EX, MEM, WB), data/control hazard resolution, multi-level CPU cache hierarchies, and virtual memory translation (TLB).",
      keyConcepts: [
        {
          term: "5-Stage Pipeline & Hazards",
          explanation:
            "Instruction Fetch (IF), Decode (ID), Execute (EX), Memory (MEM), and Writeback (WB) overlap 5 instructions concurrently; Data forwarding and branch prediction mitigate RAW and control hazards.",
        },
        {
          term: "Data Forwarding (Bypassing) vs. Load-Use Stall",
          explanation:
            "ALU results from EX/MEM can be wired directly back to the next instruction's EX input in 0 stall cycles, whereas a `lw` followed immediately by a dependent ALU op requires a 1-cycle pipeline bubble.",
        },
        {
          term: "Set-Associative CPU Caches (Tag, Index, Offset)",
          explanation:
            "A physical address splits into `[Tag | Set Index | Block Offset]`; K-way set associativity checks K cache lines in parallel to reduce conflict misses.",
        },
        {
          term: "Average Memory Access Time (AMAT)",
          explanation:
            "AMAT = Hit Time + (Miss Rate × Miss Penalty); even a 2% L1 miss rate with a 100-cycle DRAM penalty triples effective memory latency.",
        },
        {
          term: "Translation Lookaside Buffer (TLB)",
          explanation:
            "A hardware cache of recent Virtual Page Number (VPN) -> Physical Frame Number (PFN) translations that avoids 4-level page-table walks on every memory reference.",
        },
      ],
      mentalModel:
        "A modern CPU is a speculative assembly line: keeping the arithmetic units fed requires predicting branches ahead of time, forwarding results before they hit registers, and keeping 98%+ of memory accesses inside 64-byte L1/L2 cache lines.",
      workedExample: `# RISC-V Assembly & Pipeline Hazard Analysis
# C code: for (int i = 0; i < n; i++) sum += arr[i];
loop:
    slli t0, s0, 2        # t0 = i * 4 (byte offset)
    add  t1, a0, t0       # RAW hazard on t0 -> resolved by EX->EX forwarding!
    lw   t2, 0(t1)        # Load arr[i] from memory
    add  s1, s1, t2       # Load-Use hazard on t2 -> 1 stall bubble before MEM->EX forward
    addi s0, s0, 1        # i++ (can be scheduled between lw and add s1 to eliminate stall!)
    blt  s0, a1, loop     # Branch if i < n`,
      commonPitfalls: [
        "Forgetting that a Load-Use hazard (`lw` immediately followed by an instruction reading that register) still costs 1 stall cycle even with full hardware forwarding.",
        "Confusing byte addressing with word addressing: 32-bit words require multiplying array indices by 4 (`slli` by 2).",
        "Using wrong address bit widths for a cache: for 64-byte cache lines, Offset = log2(64) = 6 bits; for S sets, Index = log2(S) bits; Tag = AddressBits - Index - Offset.",
        "Clobbering callee-saved registers (`s0-s11`, `sp`, `ra`) inside a subroutine without saving/restoring them on the stack.",
      ],
      practiceTask:
        "Write a configurable Set-Associative Cache simulator in TypeScript or C that parses a trace of 32-bit hex addresses, extracts Tag/Index/Offset bits, tracks LRU eviction, and outputs Hit Rate and AMAT.",
      modules: [
        {
          title: "Page 1 · ISA Design, Registers & Calling Conventions",
          summary:
            "How RISC-V / x86 instructions encode operations, registers, immediate offsets, and function calls.",
          sections: [
            {
              heading: "Load-Store Architecture (RISC-V)",
              body: "In RISC-V, arithmetic instructions (`add`, `sub`, `xor`, `slli`) operate exclusively on the 32 general-purpose registers (`x0`-`x31`, where `x0` is hardwired to 0). Only `lw`/`sw` (and byte/double variants) access RAM.",
            },
            {
              heading: "Caller-Saved vs. Callee-Saved Registers",
              body: "Temporary and argument registers (`t0-t6`, `a0-a7`) are caller-saved: a function may overwrite them freely. Saved registers (`s0-s11`), the stack pointer (`sp`), and return address (`ra`) must be preserved across calls by pushing them to the stack in the prologue.",
            },
          ],
          codeOrFormula: `# RISC-V Function Prologue & Epilogue
fact:
    addi sp, sp, -16      # Allocate 16-byte aligned stack frame
    sd   ra, 8(sp)        # Save return address
    sd   s0, 0(sp)        # Save callee-saved register s0
    ...
    ld   s0, 0(sp)        # Restore s0
    ld   ra, 8(sp)        # Restore return address
    addi sp, sp, 16       # Deallocate frame
    ret                   # jalr x0, 0(ra)`,
          takeaways: [
            "`x0` (`zero`) is hardwired to 0; writes to `x0` are discarded.",
            "Always save `ra` on the stack in any non-leaf function before executing `jal` / `call`.",
            "Keep `sp` 16-byte aligned according to the ABI.",
          ],
        },
        {
          title: "Page 2 · The 5-Stage Pipeline, Data Forwarding & Branch Prediction",
          summary:
            "Overlapping instruction execution and resolving Structural, Data (RAW), and Control hazards.",
          sections: [
            {
              heading: "EX-to-EX and MEM-to-EX Forwarding Paths",
              body: "When `add x1, x2, x3` is followed by `sub x4, x1, x5`, `x1` is computed at the end of cycle 3 (EX) and needed at the start of cycle 4 (EX). A forwarding mux routes the EX/MEM pipeline register directly into the ALU input without waiting for cycle 5 (WB).",
            },
            {
              heading: "Eliminating the Load-Use Bubble by Instruction Scheduling",
              body: "Because `lw` only produces data at the end of the MEM stage (cycle 4), an immediately following dependent instruction needs it at EX (cycle 4)—forcing a 1-cycle stall. Moving an independent instruction (like `addi i, i, 1`) between `lw` and the dependent `add` fills the delay slot with useful work.",
            },
          ],
          codeOrFormula: `Pipeline Timing (Eliminating Load-Use Stall via Reordering):
Before (1 stall):        After (0 stalls):
lw   t2, 0(t1)           lw   t2, 0(t1)
[STALL BUBBLE]           addi s0, s0, 1   <-- independent work fills slot!
add  s1, s1, t2          add  s1, s1, t2  <-- MEM->EX forward succeeds`,
          takeaways: [
            "ALU-to-ALU dependencies require 0 stalls with EX->EX forwarding.",
            "Load-to-ALU dependencies require 1 stall unless an independent instruction is scheduled in between.",
            "2-bit saturating branch predictors tolerate 1 loop-exit misprediction without flipping state on loop re-entry.",
          ],
        },
        {
          title: "Page 3 · CPU Cache Geometry, Miss Classification (3Cs) & AMAT",
          summary:
            "Decoding `[Tag | Index | Offset]` address bits, spatial/temporal locality, and write policies.",
          sections: [
            {
              heading: "Address Bit Partitioning Formula",
              body: "Given a 32-bit address, cache size C = 32 KB, block size B = 64 bytes, and 4-way set associativity: Offset = log2(64) = 6 bits; Number of sets S = 32768 / (64 * 4) = 128 -> Index = log2(128) = 7 bits; Tag = 32 - 7 - 6 = 19 bits.",
            },
            {
              heading: "The 3 Cs of Cache Misses & Matrix Traversal",
              body: "Compulsory (cold start), Capacity (working set > cache size), and Conflict (multiple addresses map to the same set). In row-major C/TypeScript arrays, iterating `A[i][j]` with `j` as the inner loop achieves 87.5% hit rate on 8-byte doubles per 64-byte cache line; column-wise `A[j][i]` thrashes the cache.",
            },
          ],
          codeOrFormula: `Cache Geometry & AMAT Calculation:
Address = [ Tag (19b) | Set Index (7b) | Block Offset (6b) ]
AMAT = L1_HitTime + L1_MissRate * (L2_HitTime + L2_MissRate * DRAM_Penalty)
Example: 1 cyc + 0.04 * (10 cyc + 0.20 * 200 cyc) = 1 + 0.04 * 50 = 3.0 cycles`,
          takeaways: [
            "Block Offset bits = log2(BlockSizeInBytes); Set Index bits = log2(TotalLines / Ways).",
            "Write-Back + Write-Allocate caches use a Dirty bit to defer DRAM writes until eviction.",
            "Loop tiling (blocking) keeps sub-matrices resident in L1 cache during matrix multiplication.",
          ],
        },
        {
          title: "Page 4 · Virtual Memory, Page Tables & TLB Walkthrough",
          summary:
            "How hardware translates 48-bit virtual addresses to physical RAM frames with process isolation.",
          sections: [
            {
              heading: "Page Tables & 4 KB Page Offset Invariance",
              body: "Virtual memory divides address space into 4 KB pages (2^12 bytes). The bottom 12 bits (Page Offset) are identical in both virtual and physical addresses; only the upper Virtual Page Number (VPN) is translated into a Physical Frame Number (PFN).",
            },
            {
              heading: "Virtually Indexed, Physically Tagged (VIPT) L1 Caches",
              body: "When the L1 cache index + offset uses only the bottom 12 bits (the un-translated page offset), the CPU can index the L1 cache set in parallel with the TLB lookup, comparing the physical tag once the TLB outputs the PFN.",
            },
          ],
          codeOrFormula: `Virtual Address Translation (4 KB pages -> 12-bit offset):
Virtual Addr  = [ VPN (36 bits)          | Page Offset (12 bits) ]
                         ↓ (TLB Lookup / Page Table Walk)
Physical Addr = [ PFN (Physical Frame #) | Page Offset (12 bits) ]`,
          takeaways: [
            "The 12-bit Page Offset for a 4 KB page never changes during virtual-to-physical translation.",
            "A TLB hit takes ~1 cycle; a TLB miss triggers a hardware page-table walk; a Page Fault traps to the OS.",
            "Switch to the Practice Quiz tab to verify your CS201 mastery.",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "In a 5-stage RISC-V pipeline with full data forwarding, which instruction sequence still causes a 1-cycle pipeline stall?",
        options: [
          "An `add` instruction immediately followed by a `sub` reading the `add`'s destination register",
          "A `lw` (load word) immediately followed by an `add` reading the loaded register (Load-Use hazard)",
          "Two independent `addi` instructions writing to different registers",
          "Any instruction reading register `x0`",
        ],
        correctIndex: 1,
        explanation:
          "`lw` only retrieves data from data memory at the end of the MEM stage (cycle 4), whereas the immediately following `add` needs that value at the start of its EX stage (also cycle 4), forcing a 1-cycle stall bubble.",
        difficulty: "foundation",
      },
      {
        question: "Given a 32-bit byte-addressed CPU with a 16 KB, 4-way set-associative cache and 64-byte cache blocks, how many bits are in the `[Tag, Index, Offset]` fields?",
        options: [
          "Tag = 20 bits, Index = 6 bits, Offset = 6 bits",
          "Tag = 18 bits, Index = 8 bits, Offset = 6 bits",
          "Tag = 22 bits, Index = 4 bits, Offset = 6 bits",
          "Tag = 16 bits, Index = 8 bits, Offset = 8 bits",
        ],
        correctIndex: 0,
        explanation:
          "Block size 64B -> Offset = log2(64) = 6 bits. Number of sets = 16384 / (64 * 4) = 64 sets -> Index = log2(64) = 6 bits. Tag = 32 - 6 - 6 = 20 bits.",
        difficulty: "applied",
      },
      {
        question: "An L1 cache has a 1-cycle hit time, a 5% miss rate, and a 100-cycle miss penalty to main memory. What is the Average Memory Access Time (AMAT)?",
        options: ["1.05 cycles", "5.0 cycles", "6.0 cycles", "95.0 cycles"],
        correctIndex: 2,
        explanation:
          "AMAT = Hit Time + (Miss Rate × Miss Penalty) = 1 + 0.05 × 100 = 6.0 cycles.",
        difficulty: "applied",
      },
      {
        question: "Why does a Virtually Indexed, Physically Tagged (VIPT) L1 cache avoid virtual-aliasing bugs when `Sets × BlockSize <= PageSize (4 KB)`?",
        options: [
          "Because both the Block Offset and Set Index bits fall entirely within the 12-bit untranslated Page Offset",
          "Because the TLB is bypassed completely and tags are not checked",
          "Because 4 KB pages do not use physical memory",
          "Because all cache lines share set 0",
        ],
        correctIndex: 0,
        explanation:
          "When `Index + Offset <= 12 bits`, the set index comes purely from the invariant page offset bits (which are identical in virtual and physical addresses), allowing the L1 set lookup and TLB tag translation to run in parallel.",
        difficulty: "challenge",
      },
    ],
  },
  {
    codeMatch: ["CS202"],
    keywords: ["operating systems", "os", "threads", "mutex", "deadlock", "virtual memory", "scheduling", "kernel"],
    guide: {
      overview:
        "Operating Systems covers how the kernel virtualizes CPU (preemptive scheduling, context switching), virtualizes memory (multi-level page tables, copy-on-write, demand paging), synchronizes concurrent threads (mutexes, condition variables, lock-free atomics), and persists data crash-safely on disk.",
      keyConcepts: [
        {
          term: "Processes vs. Threads & Context Switch",
          explanation:
            "Processes have isolated virtual address spaces (separate page table root CR3); threads within a process share heap and globals but have private stacks and register state.",
        },
        {
          term: "Multi-Level Page Tables & Copy-on-Write (fork)",
          explanation:
            "`fork()` shares physical frames read-only between parent and child; a write triggers a page-fault trap that duplicates only the modified 4 KB frame.",
        },
        {
          term: "Mutexes, Condition Variables & Mesa Semantics",
          explanation:
            "Waiters on a condition variable must always re-check the predicate inside a `while (!ready) cond.wait(lock)` loop because another thread can steal the state before wake-up.",
        },
        {
          term: "Coffman's 4 Deadlock Conditions",
          explanation:
            "Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait—enforcing a strict global lock acquisition ordering breaks Circular Wait.",
        },
        {
          term: "File System Inodes & Crash Journaling (WAL)",
          explanation:
            "Separating metadata inodes from data extents and writing intent records to a sequential journal prevents half-written directory corruption on power loss.",
        },
      ],
      mentalModel:
        "The OS kernel is an illusionist and referee: it gives each process the illusion of owning the entire CPU and RAM via timer interrupts and page tables, while refereeing shared state through atomic hardware primitives.",
      workedExample: `// Thread-Safe Bounded Producer-Consumer Queue (Mesa Condition Variable Pattern)
// Rule: ALWAYS wait inside a WHILE loop, never an IF statement!
void enqueue(Queue* q, Item x) {
    pthread_mutex_lock(&q->lock);
    while (q->count == q->capacity) {
        pthread_cond_wait(&q->not_full, &q->lock); // atomically releases lock & sleeps
    }
    q->buf[q->tail] = x;
    q->tail = (q->tail + 1) % q->capacity;
    q->count++;
    pthread_cond_signal(&q->not_empty);
    pthread_mutex_unlock(&q->lock);
}`,
      commonPitfalls: [
        "Using `if (count == 0) cond_wait(&cv, &lock)` instead of `while (count == 0)`, causing race bugs under spurious wakeups or signal-stealing (Mesa semantics).",
        "Acquiring `lockA` then `lockB` in Thread 1 while Thread 2 acquires `lockB` then `lockA` (classic AB-BA circular-wait deadlock).",
        "Calling non-async-signal-safe functions (like `malloc` or `printf`) inside a POSIX signal handler.",
        "Confusing Thrashing (working set > physical RAM causing continuous page-fault disk I/O) with CPU compute saturation.",
      ],
      practiceTask:
        "Implement a thread-safe Work-Stealing Thread Pool and a Simulated LRU/Clock Page Replacement engine that compares page-fault rates against Belady's MIN optimal algorithm.",
      modules: [
        {
          title: "Page 1 · CPU Virtualization, Trap Handlers & Scheduling",
          summary:
            "Limited Direct Execution, user-to-kernel privilege transitions, and MLFQ / CFS schedulers.",
          sections: [
            {
              heading: "System Calls & Hardware Trap Frames",
              body: "User processes run in unprivileged Ring 3 / U-mode. Executing a system call (`ecall` / `syscall`) or hardware timer interrupt switches the CPU to Kernel Mode, saves user registers onto the kernel stack, and jumps to the OS trap vector.",
            },
            {
              heading: "MLFQ & Completely Fair Scheduler (CFS)",
              body: "Multi-Level Feedback Queues boost interactive I/O-bound jobs while demoting CPU-hogging jobs. Linux CFS tracks each task's virtual runtime (`vruntime`) in a Red-Black tree and always schedules the runnable task with the smallest `vruntime`.",
            },
          ],
          codeOrFormula: `Turnaround vs. Response Time Metrics:
Turnaround Time = T_completion - T_arrival   (minimized by Shortest Remaining Time First)
Response Time   = T_first_run  - T_arrival   (minimized by Round-Robin / short time quantum)`,
          takeaways: [
            "Saving and restoring registers + flushing TLB/cache state gives context switches a ~1–5 microsecond overhead.",
            "Too short a time quantum wastes CPU on context-switch overhead; too long hurts interactive latency.",
            "Periodic priority boosting in MLFQ prevents starvation of long-running batch jobs.",
          ],
        },
        {
          title: "Page 2 · Concurrency, Locks, Condition Variables & Deadlock",
          summary:
            "Hardware atomics (`CAS`), Mesa condition variables, semaphores, and deadlock prevention.",
          sections: [
            {
              heading: "Compare-And-Swap (CAS) & Spinlocks vs. Futexes",
              body: "Locks cannot be built from plain loads and stores without hardware atomic instructions (`amoswap`, `cmpxchg`). Spinlocks burn CPU cycles waiting and are only used for short critical sections in the kernel; user-space mutexes (Linux `futex`) spin briefly then park the thread in the kernel wait queue.",
            },
            {
              heading: "Breaking Deadlock by Lock Address Ordering",
              body: "To transfer funds between two accounts `A` and `B` without AB-BA deadlock, always lock `min(&A->lock, &B->lock)` first and `max(&A->lock, &B->lock)` second.",
            },
          ],
          codeOrFormula: `// Deadlock-Free Dual Lock Acquisition via Total Memory-Address Ordering
void lock_both(pthread_mutex_t* m1, pthread_mutex_t* m2) {
    if (m1 == m2) { pthread_mutex_lock(m1); return; }
    pthread_mutex_t* first  = (m1 < m2) ? m1 : m2;
    pthread_mutex_t* second = (m1 < m2) ? m2 : m1;
    pthread_mutex_lock(first);
    pthread_mutex_lock(second);
}`,
          takeaways: [
            "Always wrap `pthread_cond_wait` in a `while` loop checking the state predicate.",
            "Keep Producer and Consumer on two separate condition variables (`not_empty` and `not_full`) so producers never wake other sleeping producers.",
            "Total lock ordering eliminates Circular Wait (Coffman condition #4), making deadlock impossible.",
          ],
        },
        {
          title: "Page 3 · Virtual Memory, Page Faults & Replacement Policies",
          summary:
            "4-level page tables (x86-64 / Sv48), Copy-on-Write `fork()`, and Clock/LRU page eviction.",
          sections: [
            {
              heading: "Why Multi-Level Page Tables Save Gigabytes of RAM",
              body: "A flat single-level page table for a 48-bit address space would require 2^36 entries (512 GB per process!). A 4-level radix tree (9 bits per level) allocates page-table pages only for occupied virtual regions (code, heap, stack).",
            },
            {
              heading: "The Clock (Second-Chance) Page Replacement Algorithm",
              body: "Maintaining true LRU across millions of pages on every memory load is too expensive in hardware. Instead, the MMU sets a hardware `Accessed (A)` bit on each page reference; the OS Clock hand sweeps circularly, clearing `A=1 -> 0` and evicting the first page with `A=0`.",
            },
          ],
          codeOrFormula: `x86-64 48-bit Virtual Address Breakdown (4 KB Pages):
[ Sign Ext (16b) | L4 (9b) | L3 (9b) | L2 (9b) | L1 (9b) | Page Offset (12b) ]
Each 9-bit index selects 1 of 512 8-byte Page Table Entries (512 * 8B = 4096B = 1 page).`,
          takeaways: [
            "Each page table level fits in exactly one 4 KB frame (512 entries × 8 bytes).",
            "Copy-on-Write (`COW`) makes `fork()` followed by `exec()` nearly instantaneous.",
            "Belady's Anomaly: FIFO page replacement can suffer MORE page faults when given more physical frames; LRU (a stack algorithm) never suffers Belady's Anomaly.",
          ],
        },
        {
          title: "Page 4 · File Systems, Inodes & Crash Consistency",
          summary:
            "How `ext4` / `XFS` map files to disk blocks and survive power loss via Write-Ahead Journaling.",
          sections: [
            {
              heading: "Inodes vs. Directory Entries (`dentries`)",
              body: "A file's name is not stored inside the file—it is stored in a directory mapping `filename -> inode_number`. The inode holds permissions, size, link count (`nlink`), and direct/indirect block pointers or extents. Hard links point multiple directory names to the same inode number.",
            },
            {
              heading: "Journaling (Write-Ahead Logging) Crash Recovery",
              body: "Appending a block to a file updates three separate disk locations: the inode, the data bitmap, and the data block. A power cut mid-write corrupts the filesystem unless changes are first written to a sequential journal transaction bounded by `TxBegin` and `TxCommit`.",
            },
          ],
          codeOrFormula: `Journaling Protocol for Atomic File Append:
1. Journal Write:Append [TxBegin | InodeDiff | BitmapDiff | DataBlock] to log
2. Journal Commit: Write [TxCommit] block after disk barrier (fsync)
3. Checkpoint: Apply changes to in-place filesystem locations`,
          takeaways: [
            "`unlink()` only deletes the directory entry and decrements `inode.nlink`; disk blocks are freed only when `nlink == 0` AND open file descriptors reach 0.",
            "Never write `TxCommit` in the same un-ordered disk batch as the journal payload—use a write barrier.",
            "Take the Practice Quiz tab to verify your CS202 mastery.",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "Why must a thread waiting on a POSIX/Mesa condition variable check its predicate inside a `while (!ready)` loop rather than an `if (!ready)` statement?",
        options: [
          "Because `if` statements cannot be used inside functions that hold a mutex",
          "Because between `cond_signal` and the waking thread re-acquiring the mutex, another thread may run and consume the resource (or a spurious wakeup may occur)",
          "Because `pthread_cond_wait` does not release the mutex",
          "Because `while` loops execute in Kernel Mode",
        ],
        correctIndex: 1,
        explanation:
          "Under Mesa semantics, `signal()` only makes a waiter runnable; another thread can acquire the lock first and change the state before the awakened thread resumes.",
        difficulty: "foundation",
      },
      {
        question: "How does enforcing a strict global ordering on lock acquisition (e.g., always locking the lower memory address first) prevent deadlock?",
        options: [
          "It eliminates Mutual Exclusion so multiple threads enter the critical section simultaneously",
          "It breaks the Circular Wait condition because no cycle of threads can each hold a higher-ordered lock while waiting for a lower-ordered one",
          "It disables hardware timer interrupts",
          "It forces all threads onto a single CPU core",
        ],
        correctIndex: 1,
        explanation:
          "A cycle of waiting threads would require lock addresses `L1 < L2 < ... < Lk < L1`, which is mathematically impossible under a total order.",
        difficulty: "applied",
      },
      {
        question: "Why do 64-bit operating systems use a 4-level hierarchical page table instead of a single flat array of Page Table Entries?",
        options: [
          "A flat page table for a 48-bit virtual address space would require 2^36 entries (512 GB) allocated per process even if the process only uses a few megabytes",
          "Because 4-level page tables never experience TLB misses",
          "Because physical RAM frames are 1 GB each",
          "To avoid using a Page Offset",
        ],
        correctIndex: 0,
        explanation:
          "Hierarchical radix page tables leave entire subtrees unallocated for unused virtual address ranges, compressing page table memory to a few kilobytes for typical processes.",
        difficulty: "applied",
      },
      {
        question: "In a UNIX filesystem, what happens on disk when you call `unlink(\"report.log\")` while a running process still has `report.log` open via a file descriptor?",
        options: [
          "The call fails with EBUSY and the directory entry remains",
          "The directory entry is removed immediately and `inode.nlink` drops to 0, but the inode and data blocks remain allocated until the process closes its file descriptor",
          "The data blocks are zeroed immediately, causing the reading process to crash with SIGSEGV",
          "Only the file permissions are changed to read-only",
        ],
        correctIndex: 1,
        explanation:
          "UNIX decouples directory names from inodes: data blocks are reclaimed only when both the on-disk link count (`nlink`) AND the in-kernel open file reference count reach zero.",
        difficulty: "challenge",
      },
    ],
  },
  {
    codeMatch: ["CS203"],
    keywords: ["database", "sql", "postgres", "b-tree", "b+ tree", "acid", "mvcc", "indexing", "transactions"],
    guide: {
      overview:
        "Database Systems covers relational modeling, B+ Tree and hash indexing, cost-based query optimization (Hash Join vs. Merge Join vs. Nested Loop), ACID transaction isolation levels, Multi-Version Concurrency Control (MVCC), and ARIES Write-Ahead Logging.",
      keyConcepts: [
        {
          term: "B+ Tree Index & Composite Prefix Rule",
          explanation:
            "Internal nodes route search keys with high fanout (~200+); leaf pages store sorted keys linked sequentially for fast range scans. A composite index `(a, b)` accelerates `WHERE a = 1 AND b > 5`, but cannot seek directly on `WHERE b = 5` alone.",
        },
        {
          term: "Join Algorithms (Nested Loop, Hash Join, Sort-Merge)",
          explanation:
            "Index Nested Loop shines on small outer sets with an indexed inner table; Hash Join runs in O(M + N) for equi-joins; Sort-Merge handles pre-sorted B+ Tree streams and range joins.",
        },
        {
          term: "MVCC (Multi-Version Concurrency Control)",
          explanation:
            "Each tuple carries creation/deletion transaction IDs (`xmin`, `xmax`) so readers view a consistent snapshot without blocking writers, and writers never block readers.",
        },
        {
          term: "Isolation Anomalies (Dirty, Non-Repeatable, Phantom, Write Skew)",
          explanation:
            "Snapshot Isolation prevents Dirty/Non-Repeatable/Phantom reads via snapshot visibility, but still permits Write Skew unless upgraded to Serializable Snapshot Isolation (SSI).",
        },
        {
          term: "ARIES Write-Ahead Logging (WAL)",
          explanation:
            "Every dirty page modification logs `[LSN, TxID, PageID, Undo, Redo]` and flushes the log to disk before commit (`Force-Log-at-Commit`) and before page eviction (`Steal/No-Force`).",
        },
      ],
      mentalModel:
        "A relational database engine has two halves: a Query Planner that transforms declarative SQL into the cheapest physical operator pipeline (scans, indexes, joins), and a Storage Engine that guarantees durability and isolation on 8 KB slotted pages via WAL and MVCC.",
      workedExample: `-- Composite Covering Index & Window Function Query Optimization
-- Slow: Full Seq Scan + Sort on 50M orders
-- Fast: Index-Only Scan using composite index (customer_id, created_at DESC) INCLUDE (total_cents)
CREATE INDEX idx_orders_cust_date
  ON orders (customer_id, created_at DESC)
  INCLUDE (total_cents);

EXPLAIN (ANALYZE, BUFFERS)
SELECT customer_id, created_at, total_cents,
       SUM(total_cents) OVER (PARTITION BY customer_id ORDER BY created_at) AS running_spend
FROM orders
WHERE customer_id = 4821 AND created_at >= '2026-01-01';`,
      commonPitfalls: [
        "Wrapping an indexed column in a function (`WHERE LOWER(email) = 'a@b.com'` or `WHERE YEAR(created_at) = 2026`), which disables a plain B+ Tree index unless a functional index or range predicate is used.",
        "N+1 Query Problem: executing 1 query for N parent rows and N separate queries inside a loop instead of a single `JOIN` or `WHERE id = ANY($1)`.",
        "Assuming `REPEATABLE READ` (Snapshot Isolation) prevents all race conditions—two concurrent transactions can still suffer Write Skew if they read overlapping rows and update disjoint rows.",
        "Using `OFFSET 100000 LIMIT 20` pagination (which scans and discards 100,000 rows) instead of keyset cursor pagination (`WHERE (created_at, id) < ($last_ts, $last_id) LIMIT 20`).",
      ],
      practiceTask:
        "Design a normalized PostgreSQL schema for an e-commerce order ledger, benchmark `Seq Scan` vs. `Index-Only Scan` with `EXPLAIN (ANALYZE, BUFFERS)`, and demonstrate how `SELECT ... FOR UPDATE` or `SERIALIZABLE` prevents double-spend write skew.",
      modules: [
        {
          title: "Page 1 · Slotted Pages, B+ Trees & Indexing Strategy",
          summary:
            "How tables and B+ Tree indexes are laid out in 8 KB pages and how to design high-selectivity composite indexes.",
          sections: [
            {
              heading: "Why Databases Use B+ Trees Instead of Binary Trees",
              body: "A binary tree of 100M rows has height ~27 (27 random disk/memory pointer chases). A B+ Tree packing 250 keys per 8 KB page reaches 100M rows in height 4, with the top 3 levels permanently hot in the buffer pool.",
            },
            {
              heading: "Leftmost Prefix Rule & Covering Indexes (`INCLUDE`)",
              body: "A B+ Tree on `(tenant_id, status, created_at)` is sorted lexicographically: first by `tenant_id`, then `status`, then `created_at`. Adding `INCLUDE (amount)` stores payload columns in the leaf nodes so queries avoid random heap-table fetches (`Index-Only Scan`).",
            },
          ],
          codeOrFormula: `-- Keyset (Seek) Pagination vs. OFFSET Pagination
-- Bad (O(N) discarded rows):  SELECT * FROM events ORDER BY id DESC LIMIT 25 OFFSET 500000;
-- Good (O(log N) B+ Tree seek):
SELECT id, payload, created_at
FROM events
WHERE id < $last_seen_id
ORDER BY id DESC
LIMIT 25;`,
          takeaways: [
            "Put equality columns (`=`) before range columns (`>`, `<`, `BETWEEN`) in a composite B+ Tree index.",
            "Replace large `OFFSET` pagination with keyset cursor pagination.",
            "Every extra index speeds up matching reads but adds write amplification on `INSERT`/`UPDATE`/`DELETE`.",
          ],
        },
        {
          title: "Page 2 · Query Planning, Join Algorithms & Normalization",
          summary:
            "Reading `EXPLAIN ANALYZE` plans, choosing between Hash Join and Nested Loop, and 3NF/BCNF schema design.",
          sections: [
            {
              heading: "Physical Join Operators",
              body: "1. Nested Loop Join: O(M * log N) when the inner table has an index and outer M is small. 2. Hash Join: builds an in-memory hash table on the smaller relation in O(M) and probes it in O(N). 3. Sort-Merge Join: scans two sorted streams in lockstep in O(M + N).",
            },
            {
              heading: "Boyce-Codd Normal Form (BCNF) & Functional Dependencies",
              body: "A table is in BCNF if for every non-trivial functional dependency `X -> Y`, `X` is a superkey. Normalization eliminates update, insertion, and deletion anomalies by storing each fact in one canonical place.",
            },
          ],
          codeOrFormula: `Join Cost Comparison (Outer M = 100,000 rows, Inner N = 1,000,000 rows):
- Unindexed Nested Loop: 100,000 * 1,000,000 = 10^11 comparisons ( catastrophic! )
- Hash Join (in RAM):    100,000 build + 1,000,000 probe = 1.1 * 10^6 ops (~40 ms)`,
          takeaways: [
            "Keep statistics fresh (`ANALYZE`) so the query planner accurately estimates row cardinality.",
            "Eliminate N+1 queries by batching IDs or joining in SQL.",
            "Denormalize only after measuring a real read bottleneck that covering indexes cannot solve.",
          ],
        },
        {
          title: "Page 3 · MVCC, Isolation Levels & Concurrency Anomalies",
          summary:
            "How Multi-Version Concurrency Control achieves non-blocking reads and when Write Skew occurs.",
          sections: [
            {
              heading: "Tuple Versioning (`xmin` / `xmax`) & Snapshot Visibility",
              body: "In PostgreSQL MVCC, an `UPDATE` does not overwrite a row in place—it inserts a new tuple version and marks the old version's `xmax` with the updating transaction ID. Readers only see versions committed before their snapshot timestamp.",
            },
            {
              heading: "The Write Skew Anomaly Under Snapshot Isolation",
              body: "Suppose at least 1 doctor must remain on call. Tx1 and Tx2 both read that Alice and Bob are on call (`count = 2`). Tx1 takes Alice off call; Tx2 takes Bob off call. Neither transaction modifies the same row, so both commit under Snapshot Isolation, leaving 0 doctors on call! Fixing it requires `SERIALIZABLE` (SSI) or `SELECT ... FOR UPDATE` on the shift rows.",
            },
          ],
          codeOrFormula: `-- Preventing Lost Updates / Write Skew with Pessimistic Row Locking
BEGIN;
SELECT balance FROM accounts WHERE id = 42 FOR UPDATE;
-- Other transactions attempting FOR UPDATE on id=42 block until COMMIT
UPDATE accounts SET balance = balance - 100 WHERE id = 42;
COMMIT;`,
          takeaways: [
            "Under MVCC, readers never block writers and writers never block readers.",
            "Snapshot Isolation (`REPEATABLE READ` in Postgres) preventsLost Updates on the SAME row, but allows Write Skew across DIFFERENT rows.",
            "Dead tuple versions created by MVCC updates must be reclaimed by `VACUUM`.",
          ],
        },
        {
          title: "Page 4 · ARIES Write-Ahead Logging (WAL) & Crash Recovery",
          summary:
            "How databases guarantee Durability (`D`) and Atomicity (`A`) across sudden power failures.",
          sections: [
            {
              heading: "The WAL Golden Rules: Steal / No-Force",
              body: "1. Before a dirty buffer page can be flushed to disk (`Steal`), its Undo log record must already be on disk. 2. A transaction is committed as soon as its Redo + Commit log records are fsynced to the sequential WAL (`No-Force`—dirty data pages can stay in RAM).",
            },
            {
              heading: "Three Phases of ARIES Crash Recovery",
              body: "1. Analysis: scan forward from the last checkpoint to identify dirty pages and active transactions at crash time. 2. Redo: replay all logged changes forward (repeating history, including uncommitted ones). 3. Undo: roll back uncommitted transactions in reverse LSN order.",
            },
          ],
          codeOrFormula: `ARIES Recovery Timeline on WAL Log:
[Checkpoint] ----(Analysis & Redo Forward)----> [Crash Point]
     <-----------(Undo Loser Transactions Backward)----|`,
          takeaways: [
            "Sequential WAL appends are 10x–100x faster than random 8 KB data page flushes.",
            "Redo replays history forward for ALL logged actions; Undo reverses only uncommitted loser transactions.",
            "Take the Practice Quiz tab to verify your CS203 mastery.",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "A table has a composite B+ Tree index on `(department_id, salary, hire_date)`. Which query predicate CANNOT use this index for a fast tree seek?",
        options: [
          "`WHERE department_id = 10 AND salary > 80000`",
          "`WHERE department_id = 10`",
          "`WHERE salary > 80000` (without filtering on `department_id`)",
          "`WHERE department_id = 10 AND salary = 95000 AND hire_date >= '2025-01-01'`",
        ],
        correctIndex: 2,
        explanation:
          "A composite B+ Tree is sorted by `department_id` first; without constraining the leftmost prefix `department_id`, matching `salary` values are scattered across every branch of the tree.",
        difficulty: "foundation",
      },
      {
        question: "How does Multi-Version Concurrency Control (MVCC) allow a read query to execute without blocking a concurrent `UPDATE` on the same row?",
        options: [
          "By disabling ACID atomicity during updates",
          "By keeping old committed tuple versions visible to the reader's snapshot while the writer creates a new tuple version",
          "By copying the entire database file into RAM on every SELECT",
          "By rejecting all SELECT queries while any transaction is open",
        ],
        correctIndex: 1,
        explanation:
          "Writers append a new version tagged with their transaction ID (`xmin`), leaving the prior version intact for transactions whose snapshot predates the update's commit.",
        difficulty: "applied",
      },
      {
        question: "Two concurrent transactions run at Snapshot Isolation (`REPEATABLE READ`). Both check that `SUM(on_call) >= 2` (seeing Alice and Bob on call), then Tx1 updates Alice's row to `on_call = false` while Tx2 updates Bob's row to `on_call = false`. Both commit, violating the invariant. What is this anomaly called?",
        options: ["Dirty Read", "Write Skew", "Cascading Rollback", "Hash Collision"],
        correctIndex: 1,
        explanation:
          "Write Skew happens under Snapshot Isolation when two transactions read overlapping data, make disjoint writes to different rows, and collectively break a multi-row invariant.",
        difficulty: "challenge",
      },
      {
        question: "In ARIES Write-Ahead Logging (Steal / No-Force), what are the three recovery phases executed in order after a crash?",
        options: [
          "Undo -> Redo -> Checkpoint",
          "Analysis -> Redo (repeat history forward) -> Undo (roll back uncommitted losers backward)",
          "Drop Indexes -> Truncate Table -> Restore Backup",
          "Force Pages -> Lock Table -> Vacuum",
        ],
        correctIndex: 1,
        explanation:
          "ARIES first runs Analysis from the last checkpoint, then Redo forward to reconstruct the exact pre-crash state, and finally Undo backward to reverse uncommitted transactions.",
        difficulty: "applied",
      },
    ],
  },
  {
    codeMatch: ["CS301", "CYB101", "CYB102", "CYB201", "CYB202", "CYB203", "CYB301", "CYB302", "CYB303", "CYB400"],
    keywords: ["network", "tcp", "http", "dns", "tls", "routing", "bgp", "cybersecurity", "security", "cryptography", "owasp", "firewall"],
    guide: {
      overview:
        "Networking & Security covers how packets traverse the Internet and how systems defend confidentiality, integrity, and availability: IP routing & subnetting (CIDR/BGP), reliable transport (TCP 3-way handshake, congestion control, QUIC), TLS 1.3 handshake & authenticated encryption (AES-GCM), and application security (OWASP, CSRF/XSS/SQLi defense).",
      keyConcepts: [
        {
          term: "CIDR Subnetting & Longest-Prefix Match",
          explanation:
            "Routers forward packets by matching the destination IP against the routing table entry with the longest matching subnet mask (e.g., `/24` beats `/16`).",
        },
        {
          term: "TCP Reliability, Flow Control & Congestion Control",
          explanation:
            "Sequence numbers + ACKs recover lost segments; Receive Window (`rwnd`) prevents overwhelming the receiver; Congestion Window (`cwnd` via AIMD / CUBIC / BBR) prevents collapsing network links.",
        },
        {
          term: "TLS 1.3 Ephemeral Diffie-Hellman (ECDHE) & Forward Secrecy",
          explanation:
            "Client and server generate single-session X25519 key pairs during the 1-RTT handshake; even if the server's long-term private certificate key is stolen years later, past traffic cannot be decrypted.",
        },
        {
          term: "Authenticated Encryption (AEAD / AES-GCM)",
          explanation:
            "Combines confidentiality (encryption) with a cryptographic authentication tag (MAC) so any bit flip or tampering in transit is detected before decryption.",
        },
        {
          term: "Zero-Trust Application Defense (Parameterized Queries, CSP, SameSite)",
          explanation:
            "Bind variables separate SQL code from user data; Content-Security-Policy and context-aware encoding block XSS; `HttpOnly` + `SameSite=Lax/Strict` cookies block token theft and CSRF.",
        },
      ],
      mentalModel:
        "Treat every network link as an untrusted, lossy pipe controlled by an active adversary (the Dolev-Yao model): TCP adds order and retransmission over unreliable IP packets, while TLS 1.3 adds cryptographic authenticity and tamper-proof confidentiality.",
      workedExample: `// Constant-Time HMAC Webhook Signature Verification (Node.js / Web Crypto)
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWebhookSignature(payload: string, headerSig: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(payload, "utf8").digest();
  const actual = Buffer.from(headerSig, "hex");
  if (expected.length !== actual.length) return false;
  // Never use === on MACs/hashes (leaks byte-match length via timing side-channel!)
  return timingSafeEqual(expected, actual);
}`,
      commonPitfalls: [
        "Comparing cryptographic MACs or tokens with `===` instead of `crypto.timingSafeEqual`, allowing attackers to forge signatures one byte at a time via response-time measurement.",
        "Reusing a nonce/IV with the same key in AES-GCM or ChaCha20-Poly1305, which catastrophically leaks the XOR of plaintexts and the authentication key.",
        "Confusing TCP Flow Control (`rwnd` advertised by receiver buffer) with Congestion Control (`cwnd` probed across network routers).",
        "Storing passwords with fast unsalted hashes (`SHA-256`) instead of a memory-hard KDF (`Argon2id` or `scrypt` / `bcrypt`) with a unique per-user random salt.",
      ],
      practiceTask:
        "Inspect a live HTTPS handshake (`openssl s_client` or Wireshark), implement a sliding-window rate limiter and constant-time HMAC request verifier, and audit an endpoint against SQL injection, XSS, and SSRF.",
      modules: [
        {
          title: "Page 1 · IP Routing, CIDR Subnetting & DNS Resolution",
          summary:
            "How packets are addressed, fragmented, and routed across Autonomous Systems using CIDR, ARP, OSPF, and BGP.",
          sections: [
            {
              heading: "CIDR Prefix Masks & Longest-Prefix Match",
              body: "An IPv4 `/24` prefix (mask `255.255.255.0`) leaves 8 host bits (256 addresses, 254 usable hosts). If a router's FIB contains both `10.0.0.0/16 -> NextHop A` and `10.0.4.0/24 -> NextHop B`, traffic to `10.0.4.19` always takes NextHop B because 24 matching bits > 16.",
            },
            {
              heading: "Iterative vs. Recursive DNS & Record Types",
              body: "A stub resolver queries a recursive resolver, which walks Root (`.`) -> TLD (`.com`) -> Authoritative nameserver, caching `A` (IPv4), `AAAA` (IPv6), `CNAME` (alias), and `TXT` records according to their `TTL`.",
            },
          ],
          codeOrFormula: `CIDR Quick Reference:
/24 -> 2^(32-24) = 256 IPs   (mask 255.255.255.0)
/26 -> 2^(32-26) = 64  IPs   (mask 255.255.255.192)
/28 -> 2^(32-28) = 16  IPs   (mask 255.255.255.240)`,
          takeaways: [
            "Longest-Prefix Match always wins in IP forwarding tables regardless of route insertion order.",
            "OSPF computes intra-domain shortest paths via Dijkstra; BGP exchanges inter-domain AS-path policies.",
            "NAT rewrites source IP + TCP/UDP port tuples to multiplex private RFC1918 subnets behind one public IP.",
          ],
        },
        {
          title: "Page 2 · Transport Layer: TCP Handshake, Congestion Control & QUIC",
          summary:
            "How TCP guarantees reliable byte streams and why HTTP/3 runs over UDP-based QUIC.",
          sections: [
            {
              heading: "3-Way Handshake & Fast Retransmit",
              body: "TCP establishes state via `SYN (seq=x)` -> `SYN-ACK (seq=y, ack=x+1)` -> `ACK (ack=y+1)`. Rather than waiting for a full retransmission timeout (RTO) when a packet drops, receiving 3 duplicate ACKs triggers Fast Retransmit immediately.",
            },
            {
              heading: "Slow Start, AIMD & Head-of-Line (HOL) Blocking",
              body: "TCP Slow Start doubles `cwnd` every RTT until hitting `ssthresh`, then switches to Additive Increase / Multiplicative Decrease (AIMD). Because TCP enforces strict single-stream ordering, 1 lost packet stalls all multiplexed HTTP/2 streams—which QUIC (HTTP/3 over UDP) solves by isolating loss per stream.",
            },
          ],
          codeOrFormula: `Effective TCP Send Window:
SendWindow = min(rwnd_receiver_buffer, cwnd_network_congestion)
Throughput ≈ SendWindow / RTT`,
          takeaways: [
            "3 duplicate ACKs signal packet loss while packets are still flowing (Fast Recovery: halve `cwnd`); a full Timeout resets `cwnd = 1 MSS`.",
            "`TIME_WAIT` (2×MSL) prevents delayed packets from an old incarnation from corrupting a new connection on the same 4-tuple.",
            "QUIC combines transport + TLS 1.3 into a 1-RTT (or 0-RTT resumed) handshake without TCP Head-of-Line blocking.",
          ],
        },
        {
          title: "Page 3 · Applied Cryptography & TLS 1.3 Architecture",
          summary:
            "Symmetric AEAD (AES-GCM), asymmetric signatures (Ed25519), ECDHE key exchange, and X.509 certificates.",
          sections: [
            {
              heading: "Why TLS 1.3 Needs Both Asymmetric and Symmetric Crypto",
              body: "Public-key certificates (RSA/ECDSA) authenticate the server's identity, Ephemeral Diffie-Hellman (X25519) derives a shared session secret with Forward Secrecy in 1 RTT, and symmetric AEAD (`AES-256-GCM` or `ChaCha20-Poly1305`) encrypts bulk application data at gigabits per second.",
            },
            {
              heading: "Password Hashing vs. Encryption vs. MACs",
              body: "Passwords are NEVER encrypted (which is reversible)—they are hashed with a slow, salted key derivation function (`Argon2id` or `scrypt`). API payloads are authenticated with `HMAC-SHA256`.",
            },
          ],
          codeOrFormula: `TLS 1.3 1-RTT Handshake Flow:
Client -> Server: ClientHello + KeyShare (ephemeral X25519 pubkey g^a)
Server -> Client: ServerHello + KeyShare (g^b) + {Certificate, CertVerify, Finished}_{derived_key}
Client -> Server: {Finished} + {HTTP Request Application Data}_{derived_key}`,
          takeaways: [
            "Forward Secrecy ensures compromising a server's certificate private key tomorrow cannot decrypt traffic recorded today.",
            "Never use ECB mode or unauthenticated CBC mode; always use an AEAD cipher (`AES-GCM` or `ChaCha20-Poly1305`) with a unique nonce.",
            "Always store passwords with `Argon2id` or `scrypt`/`bcrypt` + per-user random salt.",
          ],
        },
        {
          title: "Page 4 · Web & Systems Security (SQLi, XSS, CSRF, SSRF)",
          summary:
            "Hardening production applications against the most critical vulnerability classes.",
          sections: [
            {
              heading: "Injection Defense: Parameterized Queries & Output Encoding",
              body: "SQL Injection happens when user input is concatenated into a query string (`\"SELECT * FROM users WHERE name = '\" + input + \"'\"`). Parameterized prepared statements (`$1`) send the SQL AST and the parameter bytes separately so user data can never alter query syntax.",
            },
            {
              heading: "SSRF (Server-Side Request Forgery) & Cloud Metadata Protection",
              body: "When a backend fetches a user-supplied URL (e.g. webhook or avatar preview), an attacker can pass `http://169.254.169.254/latest/meta-data/` or internal VPC IPs. Resolve DNS once, block private/link-local CIDR blocks (`10.0.0.0/8`, `127.0.0.0/8`, `169.254.0.0/16`), and disable unvalidated redirects.",
            },
          ],
          codeOrFormula: `// Safe Parameterized SQL vs. Vulnerable String Interpolation
// VULNERABLE: await db.query(\`SELECT * FROM users WHERE email = '\${email}'\`);
// SAFE:       await db.query("SELECT id, email FROM users WHERE email = $1", [email]);`,
          takeaways: [
            "Never concatenate untrusted strings into SQL, shell commands (`exec`), or HTML.",
            "Use `HttpOnly; Secure; SameSite=Lax` cookies plus CSRF tokens for state-changing POST/DELETE endpoints.",
            "Take the Practice Quiz tab to verify your Networking & Security mastery.",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "A router's forwarding table has three matching entries for destination `192.168.10.45`: `192.168.0.0/16 -> Port 1`, `192.168.10.0/24 -> Port 2`, and `192.168.10.32/27 -> Port 3`. Which port is chosen?",
        options: [
          "Port 1, because `/16` covers the largest address block",
          "Port 2, because `/24` is the default class C mask",
          "Port 3, because `192.168.10.32/27` (addresses .32 to .63) has the longest matching prefix (27 bits)",
          "The packet is broadcast to all three ports",
        ],
        correctIndex: 2,
        explanation:
          "`192.168.10.45` falls inside `192.168.10.32/27` (`.32`–`.63`), and IP routers always select the matching route with the longest prefix length (`/27` > `/24` > `/16`).",
        difficulty: "foundation",
      },
      {
        question: "In TCP, what is the difference between receiving 3 Duplicate ACKs versus experiencing a full Retransmission Timeout (RTO)?",
        options: [
          "3 Duplicate ACKs indicate packets are still arriving (triggering Fast Retransmit & halving `cwnd`), whereas an RTO indicates severe congestion and resets `cwnd` to 1 MSS",
          "3 Duplicate ACKs close the TCP connection immediately",
          "An RTO increases `cwnd` exponentially",
          "There is no difference; both ignore `cwnd`",
        ],
        correctIndex: 0,
        explanation:
          "Duplicate ACKs prove later segments are still reaching the receiver, so Fast Recovery halves `cwnd` instead of resetting it to 1 MSS.",
        difficulty: "applied",
      },
      {
        question: "How does TLS 1.3 achieve Forward Secrecy?",
        options: [
          "By encrypting the session key with the server's static RSA certificate public key",
          "By using Ephemeral Diffie-Hellman (ECDHE) key shares generated fresh for each session and discarded after deriving session keys",
          "By sending the symmetric key in plaintext inside the HTTP Host header",
          "By reusing the same AES-GCM nonce across all connections",
        ],
        correctIndex: 1,
        explanation:
          "Because the ephemeral Diffie-Hellman private values are never stored on disk and are destroyed after the handshake, a future compromise of the server's certificate key cannot decrypt recorded past sessions.",
        difficulty: "applied",
      },
      {
        question: "Why must a backend verify HMAC webhook signatures using `crypto.timingSafeEqual(expected, actual)` instead of `expectedHex === actualHex`?",
        options: [
          "Because `===` throws a TypeError on strings longer than 32 characters",
          "Standard string equality returns `false` on the first mismatched byte, leaking how many leading bytes matched via microsecond response-time differences",
          "Because `timingSafeEqual` compresses the payload with gzip",
          "Because SHA-256 outputs random results each time",
        ],
        correctIndex: 1,
        explanation:
          "Early-exit byte comparison leaks prefix match length through timing side channels, allowing an attacker to brute-force a 32-byte MAC in `32 × 256` guesses instead of `2^256`.",
        difficulty: "challenge",
      },
    ],
  },
  {
    codeMatch: ["CS302", "DS101", "DS102", "DS201", "DS202", "DS203", "DS301", "DS302", "DS303", "DS400"],
    keywords: ["distributed systems", "raft", "paxos", "consensus", "replication", "consistent hashing", "cap theorem", "lamport", "microservices"],
    guide: {
      overview:
        "Distributed Systems addresses how independent machines coordinate over asynchronous networks with partial failures: logical clocks (Lamport & Vector Clocks), quorum replication, Raft/Paxos consensus & split-brain prevention, Two-Phase Commit vs. Saga orchestration, and Consistent Hashing with virtual nodes.",
      keyConcepts: [
        {
          term: "Happens-Before (`->`) & Vector Clocks",
          explanation:
            "Without a synchronized global physical clock, Lamport timestamps order causally related events (`a -> b => L(a) < L(b)`), while Vector Clocks detect both causality and concurrent write conflicts.",
        },
        {
          term: "Raft Consensus (Leader Election & Log Replication)",
          explanation:
            "Uses randomized election timeouts, monotonically increasing `term` numbers (fencing tokens), and majority quorums (`floor(N/2) + 1`) so committed log entries survive up to `f` node crashes in a `2f + 1` cluster.",
        },
        {
          term: "Quorum Intersection (`R + W > N`)",
          explanation:
            "In leaderless Dynamo-style replication across N nodes, requiring W write acks and R read responses with `R + W > N` guarantees the read set overlaps with the latest write set by at least 1 node.",
        },
        {
          term: "Consistent Hashing & Virtual Nodes",
          explanation:
            "Maps both storage nodes and keys onto a `0..2^32-1` hash ring so adding or removing a shard moves only `O(K / N)` keys instead of reshuffling the entire `hash(key) % N` cluster.",
        },
        {
          term: "Idempotency Keys & At-Least-Once Delivery",
          explanation:
            "Because network timeouts cannot distinguish 'request lost before execution' from 'ACK lost after execution', retries require an `Idempotency-Key` stored transactionally by the receiver.",
        },
      ],
      mentalModel:
        "In a distributed system, you never know whether a silent peer has crashed or is merely experiencing a slow GC pause or network partition: safety relies on majority quorums (two majorities always overlap by at least one member) and monotonic term/fencing numbers.",
      workedExample: `// Consistent Hashing Ring with Virtual Nodes — O(log(N * V)) key lookup
export class ConsistentHashRing {
  private ring: Array<{ hash: number; node: string }> = [];

  constructor(nodes: string[], vnodes = 64) {
    for (const node of nodes) {
      for (let v = 0; v < vnodes; v++) {
        this.ring.push({ hash: this.fnv1a(\`\${node}#\${v}\`), node });
      }
    }
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  getNode(key: string): string {
    const h = this.fnv1a(key);
    let lo = 0, hi = this.ring.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.ring[mid].hash >= h) hi = mid - 1;
      else lo = mid + 1;
    }
    return this.ring[lo < this.ring.length ? lo : 0].node;
  }

  private fnv1a(str: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }
}`,
      commonPitfalls: [
        "Using wall-clock `Date.now()` (NTP can jump backward during clock skew corrections!) to order distributed events or lock expirations instead of monotonic fencing tokens or logical clocks.",
        "Running a 2-node or 4-node Raft/etcd cluster thinking 4 nodes tolerate more failures than 3 (both 3 and 4 nodes require a majority of 2 or 3, so both only tolerate 1 node failure!).",
        "Retrying a non-idempotent payment or order RPC after a timeout without attaching a deterministic client `Idempotency-Key`.",
        "Assuming a distributed lock lease is still valid without passing an incrementing fencing token to the storage layer (a thread paused by GC can wake up after its lease expires and corrupt the new lock holder's write).",
      ],
      practiceTask:
        "Implement a 5-node Raft state machine simulator (Follower, Candidate, Leader) handling `RequestVote` and `AppendEntries` RPCs across a simulated network partition, verifying that split-brain writes never commit.",
      modules: [
        {
          title: "Page 1 · Time, Causality, Lamport & Vector Clocks",
          summary:
            "Why physical wall clocks fail across machines and how Vector Clocks distinguish causality from concurrency.",
          sections: [
            {
              heading: "NTP Skew & The Fallacy of Global Wall-Clock Ordering",
              body: "Physical quartz clocks drift by 10–100 ppm (~1–10 ms between NTP syncs), and NTP adjustments can step system time backward. Relying on `timestamp_A < timestamp_B` across two servers to pick the 'Last Write Wins' silently drops newer causal updates.",
            },
            {
              heading: "Lamport Timestamps vs. Vector Clocks",
              body: "A Lamport clock increments `L = max(L_local, L_msg) + 1` on message receipt. It guarantees `a -> b => L(a) < L(b)`, but the converse is false (`L(a) < L(b)` does not prove `a` caused `b`). A Vector Clock `V[1..N]` tracks each node's causal frontier: `V(a) < V(b)` iff `a -> b`; if neither `V(a) <= V(b)` nor `V(b) <= V(a)`, the events are concurrent conflicts.",
            },
          ],
          codeOrFormula: `Vector Clock Comparison (3 nodes [N1, N2, N3]):
Event A = [2, 1, 0]
Event B = [2, 2, 1]  --> A[i] <= B[i] for all i  ==> A happened-before B (A -> B)
Event C = [1, 3, 0]  --> A[0] > C[0] but A[1] < C[1] ==> A and C are CONCURRENT (A || C)`,
          takeaways: [
            "Lamport timestamps provide a total order consistent with causality, but cannot detect whether two events were concurrent.",
            "Vector clocks detect concurrent writes (`A || C`) so replicas can preserve siblings or merge them via CRDTs.",
            "Never use `Date.now()` for distributed lock safety—use monotonic fencing tokens.",
          ],
        },
        {
          title: "Page 2 · Raft Consensus, Leader Election & Split-Brain Prevention",
          summary:
            "How Raft elects a single leader per term and replicates a strongly consistent state-machine log.",
          sections: [
            {
              heading: "Majority Quorums (`2f + 1`) & Election Safety",
              body: "A cluster of `2f + 1` nodes requires `f + 1` votes to elect a leader and `f + 1` acknowledgments to commit a log entry. Because each node votes at most once per `term`, at most one candidate can assemble `f + 1` votes in a term.",
            },
            {
              heading: "The Election Restriction (Up-to-Date Log Check)",
              body: "A voter rejects a candidate's `RequestVote` if the voter's last log entry has a higher term (or same term and longer length) than the candidate's. Combined with majority intersection, this guarantees any newly elected leader already holds every committed log entry.",
            },
          ],
          codeOrFormula: `Raft Log Up-To-Date Rule (Voter V grants vote to Candidate C only if):
(C.lastLogTerm > V.lastLogTerm) ||
(C.lastLogTerm === V.lastLogTerm && C.lastLogIndex >= V.lastLogIndex)`,
          takeaways: [
            "3 nodes tolerate 1 failure (quorum 2); 5 nodes tolerate 2 failures (quorum 3). Always use an odd number of consensus nodes.",
            "If an old leader is partitioned in a minority subnet, it cannot gather `f + 1` `AppendEntries` ACKs, so its writes never commit.",
            "When the minority heals and sees a higher `term` from the new leader, the old leader immediately steps down to Follower.",
          ],
        },
        {
          title: "Page 3 · Consistent Hashing, Quorums (`R + W > N`) & Partitioning",
          summary:
            "Scaling storage horizontally across shards without full re-hashing or single points of failure.",
          sections: [
            {
              heading: "Why `hash(key) % N` Fails When N Changes",
              body: "With modulo sharding across `N = 10` servers, adding an 11th server changes `hash(key) % 11` for ~91% of all keys, causing a thundering herd of cache misses. Consistent hashing on a ring moves only `1 / (N + 1)` (~9%) of keys.",
            },
            {
              heading: "Tunable Quorums, Read Repair & Sloppy Quorums",
              body: "With `N = 3` replicas, setting `W = 2, R = 2` (`2 + 2 > 3`) guarantees strong quorum overlap. If a read sees `[v1, v2]` from two replicas, Read Repair asynchronously writes `v2` back to the stale replica.",
            },
          ],
          codeOrFormula: `Quorum Overlap Invariant (N = 5 replicas):
- Strong Quorum: W = 3, R = 3  (R + W = 6 > 5 -> guaranteed latest value)
- Fast Read:     W = 5, R = 1  (R + W = 6 > 5 -> 1-node read, but any node crash blocks writes)
- Eventual:      W = 1, R = 1  (R + W = 2 <= 5 -> lowest latency, may read stale replica)`,
          takeaways: [
            "Virtual nodes (e.g., 64–256 tokens per physical server) prevent hot-spot skew on a consistent hash ring.",
            "Strict quorum reads (`R + W > N`) ensure overlap with the latest successful write.",
            "Combine consistent hashing with replication by walking clockwise around the ring to the first `N` distinct physical hosts.",
          ],
        },
        {
          title: "Page 4 · Distributed Transactions: 2PC vs. Saga & Idempotency",
          summary:
            "Coordinating multi-service mutations across microservices without blocking locks.",
          sections: [
            {
              heading: "Why Two-Phase Commit (2PC) Is a Blocking Protocol",
              body: "In 2PC, Phase 1 asks all participants to `Prepare` (acquiring durable row locks and voting Yes/No). If the Coordinator crashes after participants vote Yes, participants are stuck holding locks until the Coordinator recovers.",
            },
            {
              heading: "Saga Pattern & Idempotent Retries",
              body: "A Saga splits a long transaction into local transactions `T1 -> T2 -> T3` with compensating rollback actions `C3 -> C2 -> C1` (e.g., `refundPayment`, `releaseInventory`). Every step must be idempotent using a unique `Idempotency-Key` so retries are safe.",
            },
          ],
          codeOrFormula: `// Idempotent Payment Handler Sketch (PostgreSQL Transactional Outbox / Key Table)
// INSERT INTO idempotency_keys (key, response_json) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING;`,
          takeaways: [
            "Exactly-once network delivery does not exist—achieve effective-once semantics via at-least-once retries + idempotent receivers.",
            "Use the Transactional Outbox pattern to update the database and enqueue an event atomically in one local DB transaction.",
            "Take the Practice Quiz tab to verify your Distributed Systems mastery.",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "In a 5-node Raft consensus cluster (`N = 5`), how many nodes can crash simultaneously while the cluster continues to elect leaders and commit writes?",
        options: [
          "1 node",
          "2 nodes (leaving a majority quorum of 3 nodes alive)",
          "3 nodes",
          "4 nodes",
        ],
        correctIndex: 1,
        explanation:
          "A 5-node cluster requires a majority quorum of `floor(5/2) + 1 = 3` nodes, so it can survive `5 - 3 = 2` node failures.",
        difficulty: "foundation",
      },
      {
        question: "Two events on a 3-node cluster have Vector Clocks `V(A) = [3, 1, 0]` and `V(B) = [2, 4, 0]`. What is the causal relationship between A and B?",
        options: [
          "A happened-before B (`A -> B`)",
          "B happened-before A (`B -> A`)",
          "A and B are concurrent (`A || B`) because neither vector is element-wise `<=` the other",
          "A and B occurred on the same machine at the same instant",
        ],
        correctIndex: 2,
        explanation:
          "Node 1's counter is higher in A (`3 > 2`) while Node 2's counter is higher in B (`4 > 1`), proving neither event knew about the other when it occurred (concurrent conflict).",
        difficulty: "applied",
      },
      {
        question: "Why do production systems use Consistent Hashing with Virtual Nodes instead of `hash(key) % N`?",
        options: [
          "Because modulo division is illegal on 64-bit CPUs",
          "When a node is added or removed, Consistent Hashing remaps only `~1/N` of the keys instead of `~(N-1)/N`, and Virtual Nodes balance load evenly across heterogeneous servers",
          "Because Consistent Hashing stores all keys on a single master server",
          "To eliminate the need for network sockets",
        ],
        correctIndex: 1,
        explanation:
          "Consistent hashing bounds key movement to `O(K / N)` on cluster membership changes, and virtual nodes prevent uneven ring gaps from overloading a single shard.",
        difficulty: "applied",
      },
      {
        question: "A client holds a distributed lock lease on Resource X, pauses for 15 seconds due to a JVM/Go GC pause while its lease expires, and a second client acquires the lock. How do you prevent the first client from corrupting Resource X when it wakes up?",
        options: [
          "Have the client check `Date.now()` before sending the write",
          "Have the lock service issue a monotonically increasing Fencing Token with each lease, and make the storage server reject any write carrying a token older than the highest token seen",
          "Set the lock TTL to 1 millisecond",
          "Retry the write 3 times without checking the token",
        ],
        correctIndex: 1,
        explanation:
          "A client can pause *after* checking its local timer and *before* its packet hits storage; only the storage server checking a monotonic Fencing Token (`token < max_seen_token => reject`) guarantees safety.",
        difficulty: "challenge",
      },
    ],
  },
  {
    codeMatch: ["CS303"],
    keywords: ["compiler", "lexer", "parser", "ast", "ssa", "type checking", "llvm", "codegen", "interpreter"],
    guide: {
      overview:
        "Compiler Design traces how source text becomes optimized machine code: Lexical Analysis (NFA/DFA & maximal munch), Parsing (LL Recursive Descent vs. Pratt Operator-Precedence vs. LR), Semantic Analysis (Symbol Tables, Hindley-Milner Type Inference), Static Single Assignment (SSA) Intermediate Representation, Dataflow Optimizations, and Register Allocation via Graph Coloring.",
      keyConcepts: [
        {
          term: "Maximal Munch Lexing & DFA",
          explanation:
            "The lexer scans the longest prefix matching any token pattern (so `>=` is one `GTE` token rather than `>` + `=`, and `ifelse` is an `IDENT` rather than `IF` + `ELSE`).",
        },
        {
          term: "Pratt Parsing (Top-Down Operator Precedence)",
          explanation:
            "Associates left and right binding powers (`lbp`, `rbp`) with each operator token to parse arbitrary precedence and associativity cleanly without deeply nested grammar rules.",
        },
        {
          term: "Static Single Assignment (SSA) & Phi (φ) Nodes",
          explanation:
            "Every variable in SSA IR is assigned exactly once (`x1`, `x2`); control-flow merge points insert `x3 = φ(x1, x2)` to make Use-Def chains explicit for Dead Code Elimination and Constant Propagation.",
        },
        {
          term: "Liveness Analysis & Chaitin Graph Coloring",
          explanation:
            "Computes which temporaries are simultaneously live across basic blocks, builds an interference graph, and K-colors it onto K physical CPU registers (spilling to the stack if not K-colorable).",
        },
        {
          term: "Closure Conversion & Lexical Environments",
          explanation:
            "First-class functions that capture outer local variables are lowered into a pair `{ fn_ptr, env_struct_ptr }` so captured variables outlive their enclosing stack frame.",
        },
      ],
      mentalModel:
        "A compiler is a pipeline of meaning-preserving representations: Characters -> Tokens -> AST (hierarchical syntax) -> Typed AST (validated semantics) -> SSA CFG (dataflow optimization graph) -> Machine Instructions (scheduled onto physical registers).",
      workedExample: `// Pratt Parser (Top-Down Operator Precedence) Core Loop
function parseExpression(minBp: number): Expr {
  let lhs = parsePrefix(); // number, identifier, unary '-', or '( expr )'
  while (true) {
    const op = peekToken();
    const bp = infixBindingPower(op); // e.g. '+' -> [10, 11], '*' -> [20, 21], '^' -> [31, 30]
    if (!bp || bp[0] < minBp) break;
    consumeToken();
    const rhs = parseExpression(bp[1]);
    lhs = { kind: "Binary", op, lhs, rhs };
  }
  return lhs;
}`,
      commonPitfalls: [
        "Writing left-recursive grammar rules (`Expr -> Expr '+' Term`) in a naive recursive-descent parser, which recurses infinitely without consuming a single token.",
        "Mutating a single global Symbol Table without lexical scope push/pop frames, causing inner shadowed variables to overwrite outer bindings.",
        "Eliminating an unused variable assignment in Dead Code Elimination when its right-hand side is an impure function call with side effects (`const _ = launchMissile()`).",
        "Confusing Liveness (a variable's value will be READ in the future before being overwritten) with Reachability.",
      ],
      practiceTask:
        "Build a complete compiler pipeline for a typed expression language: Lexer -> Pratt Parser -> Scoped Type Checker -> Stack-VM or SSA IR Emitter with Constant Folding and Dead Code Elimination.",
      modules: [
        {
          title: "Page 1 · Lexical Analysis, Regular Expressions & Pratt Parsing",
          summary:
            "Turning raw character streams into tokens and building Abstract Syntax Trees without left-recursion traps.",
          sections: [
            {
              heading: "Maximal Munch & Keyword Disambiguation",
              body: "When scanning `whileCount = 10`, a naive check for `" + "`while`" + "` at the start would emit a `WHILE` keyword followed by `Count`. Maximal munch consumes the entire identifier `[a-zA-Z_][a-zA-Z0-9_]*` first, then checks a keyword table.",
            },
            {
              heading: "Why Pratt Parsing Beats 12-Layer Precedence Grammars",
              body: "In a language with 12 operator precedence levels (assignment, logical OR/AND, bitwise, equality, comparison, shift, add, mul, exponent, unary, postfix), a pure BNF recursive-descent parser needs 12 mutually recursive functions. A Pratt parser handles all levels in one table of binding powers `[left_bp, right_bp]`, where `left_bp < right_bp` gives left-associativity and `left_bp > right_bp` gives right-associativity.",
            },
          ],
          codeOrFormula: `Pratt Binding Powers (Left vs. Right Associativity):
'+' / '-' : [10, 11]  (left-assoc:  1 - 2 - 3   => (1 - 2) - 3)
'*' / '/' : [20, 21]  (left-assoc:  2 * 3 * 4   => (2 * 3) * 4)
'^' (pow) : [31, 30]  (right-assoc: 2 ^ 3 ^ 2   => 2 ^ (3 ^ 2) = 512)`,
          takeaways: [
            "Eliminate left recursion (`A -> A α | β`) by rewriting as `A -> β A'` (`EBNF: β (α)*`) or using Pratt parsing.",
            "Set `right_bp = left_bp + 1` for left-associative operators and `right_bp = left_bp - 1` for right-associative operators.",
            "Attach source line/column spans (`Span { start, end }`) to every token and AST node for clear error diagnostics.",
          ],
        },
        {
          title: "Page 2 · Scoped Symbol Tables, Type Checking & Closures",
          summary:
            "Resolving variable bindings across nested lexical scopes and enforcing sound static types.",
          sections: [
            {
              heading: "Parent-Pointer Environment Chains",
              body: "Each block or function creates a new `Scope { bindings: Map<string, Symbol>, parent: Scope | null }`. Looking up an identifier walks `curr = curr.parent` from innermost to outermost scope, naturally supporting lexical shadowing.",
            },
            {
              heading: "Upvalues & Closure Capture Lowering",
              body: "When an inner lambda references a local variable `x` from an outer function that has already returned, `x` cannot die with the outer stack frame—the compiler hoists `x` into a heap-allocated closure environment record.",
            },
          ],
          codeOrFormula: `// Lexical Scope Chain Resolution
class Scope {
  private symbols = new Map<string, Type>();
  constructor(public readonly parent: Scope | null = null) {}
  define(name: string, ty: Type) { this.symbols.set(name, ty); }
  lookup(name: string): Type | null {
    return this.symbols.get(name) ?? this.parent?.lookup(name) ?? null;
  }
}`,
          takeaways: [
            "Never flatten nested blocks into a single symbol map; use linked parent scopes or a scope stack.",
            "Distinguish l-values (assignable storage locations) from r-values (computed temporary values) during semantic analysis.",
            "Verify that all control-flow paths in a non-void function end with a `return` statement.",
          ],
        },
        {
          title: "Page 3 · SSA Intermediate Representation & Dataflow Optimizations",
          summary:
            "Lowering ASTs into Control Flow Graphs (CFGs) in Static Single Assignment form.",
          sections: [
            {
              heading: "Why Compilers Convert to SSA Form",
              body: "In non-SSA code (`x = 1; x = x + 2;`), finding which definition reaches a use requires iterative reaching-definitions analysis across the CFG. In SSA (`x0 = 1; x1 = x0 + 2;`), every variable name has a single unique definition site, making Constant Propagation and Common Subexpression Elimination O(1) lookups.",
            },
            {
              heading: "Phi (φ) Functions at Dominance Frontier Join Points",
              body: "When an `if/else` assigns `x1 = 10` in the `then` branch and `x2 = 20` in the `else` branch, the merge basic block begins with `x3 = φ(BB_then: x1, BB_else: x2)`.",
            },
          ],
          codeOrFormula: `Before SSA:                 In SSA Form:
x = 4                       x0 = 4
if (c) { x = x * 2 }        if (c) { x1 = x0 * 2 }   // folded to x1 = 8!
else   { x = x + 1 }        else   { x2 = x0 + 1 }   // folded to x2 = 5!
return x                    x3 = φ(x1, x2); return x3`,
          takeaways: [
            "Place φ-nodes at the Dominance Frontier of basic blocks that assign to a variable.",
            "Constant Propagation + Dead Branch Elimination can delete entire unreachable basic blocks at compile time.",
            "Only eliminate dead instructions that have zero observable side effects (no memory stores, I/O, or traps).",
          ],
        },
        {
          title: "Page 4 · Liveness Analysis & Graph-Coloring Register Allocation",
          summary:
            "Mapping an unlimited number of SSA temporaries onto a fixed set of physical CPU registers.",
          sections: [
            {
              heading: "Backward Liveness Dataflow Equations",
              body: "A variable `v` is live at program point `p` if there is a path from `p` to a read of `v` that does not overwrite `v`. Liveness is computed backward: `LiveIn[B] = Use[B] ∪ (LiveOut[B] - Def[B])` and `LiveOut[B] = ∪_{S in succ(B)} LiveIn[S]`.",
            },
            {
              heading: "Interference Graph & Chaitin-Briggs Simplification",
              body: "Two temporaries interfere (cannot share a physical register) if they are simultaneously live at any instruction. Any node with degree `< K` can be pushed onto a stack and guaranteed a free color among `K` registers; if all remaining nodes have degree `>= K`, one variable is spilled to a stack frame slot.",
            },
          ],
          codeOrFormula: `Backward Liveness Equations per Basic Block B:
LiveOut[B] = U_{S in Succ(B)} LiveIn[S]
LiveIn[B]  = Use[B] U (LiveOut[B] \\ Def[B])`,
          takeaways: [
            "Liveness flows BACKWARD from future reads (`Use`) back to definitions (`Def`).",
            "Two variables with non-overlapping live ranges can share the same physical CPU register.",
            "Take the Practice Quiz tab to verify your CS303 Compiler Design mastery.",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "Why does a lexer use the 'Maximal Munch' (longest match) rule when scanning source code?",
        options: [
          "So that `whileLoop` is scanned as a single identifier `whileLoop` rather than the keyword `while` followed by `Loop`, and `>=` is scanned as one token rather than `>` and `=`",
          "To skip comments and whitespace faster than O(N)",
          "To execute the program without a parser",
          "Because regular expressions cannot match single characters",
        ],
        correctIndex: 0,
        explanation:
          "Maximal Munch always consumes the longest valid lexeme prefix before classifying keywords or operators.",
        difficulty: "foundation",
      },
      {
        question: "In a Pratt (Top-Down Operator Precedence) parser, how do you make the exponentiation operator `^` right-associative (`2 ^ 3 ^ 2 == 2 ^ (3 ^ 2)`) while keeping `*` left-associative?",
        options: [
          "Give `^` a right binding power slightly LOWER than its left binding power (`[31, 30]`), whereas `*` has a right binding power slightly HIGHER (`[20, 21]`)",
          "Parse `^` inside the lexer instead of the parser",
          "Give `^` a binding power of 0",
          "Reverse the input string before parsing",
        ],
        correctIndex: 0,
        explanation:
          "When `rbp < lbp` (`30 < 31`), a subsequent `^` token with `lbp = 31 >= minBp (30)` is consumed inside the recursive right-hand call, grouping `2 ^ (3 ^ 2)`.",
        difficulty: "applied",
      },
      {
        question: "What is the role of a `φ` (Phi) node in Static Single Assignment (SSA) Intermediate Representation?",
        options: [
          "It allocates heap memory for closures",
          "At a control-flow merge block (such as after an `if/else`), it selects which predecessor branch's version of a variable (`x1` or `x2`) flows into the new single-assignment name `x3`",
          "It encrypts string literals in the binary",
          "It converts recursion into a syntax error",
        ],
        correctIndex: 1,
        explanation:
          "Because SSA forbids assigning to the same variable name in two branches, a `φ(x1, x2)` node at the join block merges the incoming values into a fresh SSA variable `x3`.",
        difficulty: "applied",
      },
      {
        question: "During Graph-Coloring Register Allocation for K physical registers, when do two temporary variables have an edge between them in the Interference Graph?",
        options: [
          "Whenever both variables have the same data type (e.g. `int`)",
          "Whenever their live ranges overlap (both variables are simultaneously live at some program point), meaning they cannot be assigned the same physical register",
          "Whenever they are defined in different functions",
          "Whenever one variable is a constant 0",
        ],
        correctIndex: 1,
        explanation:
          "If two variables are both live at the same point, holding them in the same register would overwrite a value that will still be read later.",
        difficulty: "challenge",
      },
    ],
  },
  {
    codeMatch: ["MATH101"],
    keywords: ["discrete math", "logic", "induction", "combinatorics", "modular arithmetic", "set theory", "graph theory"],
    guide: {
      overview:
        "Discrete Mathematics provides the formal proof and counting toolkit for computer science: Propositional & Predicate Logic (De Morgan's laws, contraposition), Mathematical & Structural Induction, Combinatorics & Pigeonhole Principle, Modular Arithmetic (RSA/Euler/Fermat), and Graph Theory.",
      keyConcepts: [
        {
          term: "Implication Equivalence & Contrapositive",
          explanation:
            "`P -> Q` is logically equivalent to `¬P ∨ Q` and to its contrapositive `¬Q -> ¬P`, but NOT to its converse `Q -> P`.",
        },
        {
          term: "Strong & Structural Induction",
          explanation:
            "Proves `P(n)` for all `n >= b` by verifying the base case `P(b)` and showing `[P(b) ∧ ... ∧ P(k)] -> P(k+1)` (essential for divide-and-conquer and tree algorithms).",
        },
        {
          term: "Permutations, Combinations & Inclusion-Exclusion",
          explanation:
            "`C(n, k) = n! / (k!(n-k)!)` counts unordered subsets; Inclusion-Exclusion `|A ∪ B| = |A| + |B| - |A ∩ B|` avoids double-counting overlapping sets.",
        },
        {
          term: "Modular Inverses & Extended Euclidean Algorithm",
          explanation:
            "`a` has a multiplicative inverse modulo `m` (`a * x ≡ 1 (mod m)`) if and only if `gcd(a, m) == 1`, found in O(log m) steps via Bézout coefficients `a*x + m*y = 1`.",
        },
        {
          term: "Handshaking Lemma & Euler/Bipartite Graphs",
          explanation:
            "In any graph, `sum(deg(v)) = 2|E|`; a graph is bipartite (2-colorable) iff it contains no odd-length cycles.",
        },
      ],
      mentalModel:
        "Discrete math is the type checker for algorithmic reasoning: induction proves recursive code works for every input size N, combinatorics counts the size of search spaces, and modular arithmetic powers hashing and cryptography.",
      workedExample: `// Extended Euclidean Algorithm & Modular Inverse: find x such that (a * x) % m === 1
function extGcd(a: number, b: number): [number, number, number] {
  if (b === 0) return [a, 1, 0]; // gcd, x, y such that a*x + b*y = gcd
  const [g, x1, y1] = extGcd(b, a % b);
  return [g, y1, x1 - Math.floor(a / b) * y1];
}

function modInverse(a: number, m: number): number {
  const [g, x] = extGcd(a, m);
  if (g !== 1) throw new Error("No modular inverse exists (gcd !== 1)");
  return ((x % m) + m) % m;
}
// Example: modInverse(3, 11) === 4 because (3 * 4) % 11 === 12 % 11 === 1`,
      commonPitfalls: [
        "Assuming the converse `Q -> P` or inverse `¬P -> ¬Q` follows from `P -> Q` (only the contrapositive `¬Q -> ¬P` is logically equivalent).",
        "Negating a universal quantifier `¬(∀x P(x))` as `∀x ¬P(x)` instead of `∃x ¬P(x)`.",
        "Dividing both sides of a modular congruence `a * c ≡ b * c (mod m)` by `c` when `gcd(c, m) !== 1`.",
        "In an induction proof on graphs (e.g. 'all connected graphs with...'), removing an arbitrary vertex from a `(k+1)`-vertex graph and assuming the remaining `k`-vertex graph stays connected (you must remove a spanning-tree leaf!).",
      ],
      practiceTask:
        "Implement the Extended Euclidean Algorithm, modular exponentiation `a^b mod m`, and a 2-coloring BFS bipartite graph verifier with formal induction proofs for each invariant.",
      modules: [
        {
          title: "Page 1 · Propositional Logic, Quantifiers & Proof Techniques",
          summary:
            "Truth tables, De Morgan's laws, negation of quantifiers, contrapositive proofs, and proof by contradiction.",
          sections: [
            {
              heading: "Implication Truth Table & Vacuous Truth",
              body: "`P -> Q` is false ONLY when hypothesis `P` is true and conclusion `Q` is false. When `P` is false (e.g. an empty set `x ∈ ∅`), `P -> Q` is vacuously true—which is why `.every()` on an empty array `[]` returns `true`!",
            },
            {
              heading: "Negating Nested Quantifiers",
              body: "To negate `∀ε > 0, ∃δ > 0, P(ε, δ)`, flip every `∀` to `∃`, flip every `∃` to `∀`, and negate the inner predicate: `∃ε > 0, ∀δ > 0, ¬P(ε, δ)`.",
            },
          ],
          codeOrFormula: `Logical Equivalences Cheat Sheet:
1. Implication:    (P -> Q)  <=>  (¬P ∨ Q)  <=>  (¬Q -> ¬P) [Contrapositive]
2. Negated Imp:   ¬(P -> Q)  <=>  (P ∧ ¬Q)
3. De Morgan:     ¬(P ∧ Q)   <=>  (¬P ∨ ¬Q)   |   ¬(∀x P(x)) <=> ∃x ¬P(x)`,
          takeaways: [
            "To prove `P -> Q` passes, you only need one counterexample where `P` is true and `Q` is false.",
            "Universal quantification over an empty domain (`[].every(...)`) is always vacuously `true`.",
            "When `Q` is simpler when negated (e.g., 'n is even'), prove the contrapositive `¬Q -> ¬P`.",
          ],
        },
        {
          title: "Page 2 · Mathematical, Strong & Structural Induction",
          summary:
            "Proving closed-form summations, recurrence bounds, and binary tree invariants.",
          sections: [
            {
              heading: "Weak vs. Strong Induction",
              body: "Weak induction assumes `P(k)` for a single predecessor `k` to prove `P(k+1)`. Strong induction assumes `P(j)` holds for ALL `b <= j <= k` to prove `P(k+1)`—required whenever the step jumps back to `k/2` (Binary Search, Merge Sort) or `k-1` and `k-2` (Fibonacci).",
            },
            {
              heading: "Structural Induction on Trees",
              body: "A non-empty full binary tree with `I` internal nodes always has `L = I + 1` leaves. Base case: 1 leaf (`I=0, L=1`). Inductive step: replacing a leaf with an internal node having 2 leaf children adds `+1` to `I` and `-1 + 2 = +1` to `L`.",
            },
          ],
          codeOrFormula: `Closed-Form Summations Provable by Induction:
1. Arithmetic:  1 + 2 + 3 + ... + n       = n(n + 1) / 2          = Θ(n^2)
2. Squares:     1^2 + 2^2 + ... + n^2     = n(n + 1)(2n + 1) / 6  = Θ(n^3)
3. Geometric:   1 + r + r^2 + ... + r^k   = (r^(k+1) - 1) / (r - 1)`,
          takeaways: [
            "Whenever an algorithm recurses on `N/2`, use Strong Induction for its correctness proof.",
            "In a full binary tree, `Leaves = InternalNodes + 1` and total nodes `N = 2*Leaves - 1`.",
            "Build inductive graphs from `k` to `k+1` by decomposing the `k+1` graph at a leaf vertex.",
          ],
        },
        {
          title: "Page 3 · Combinatorics, Pigeonhole Principle & Probability",
          summary:
            "Counting permutations, combinations, birthday collisions, and inclusion-exclusion.",
          sections: [
            {
              heading: "Generalized Pigeonhole Principle & Hash Collisions",
              body: "If `N` items are placed into `M` buckets, at least one bucket contains `ceil(N / M)` items. By the Birthday Paradox, hashing just `~1.17 * sqrt(M)` random keys into `M` buckets gives a >50% probability of at least one collision.",
            },
            {
              heading: "Stars and Bars (Multiset Combinations)",
              body: "The number of ways to distribute `n` identical tasks across `k` distinct servers (or non-negative integer solutions to `x1 + x2 + ... + xk = n`) is `C(n + k - 1, k - 1)`.",
            },
          ],
          codeOrFormula: `Counting Formulas:
- Ordered k-permutations of n:       P(n, k) = n! / (n - k)!
- Unordered k-subsets of n:          C(n, k) = n! / (k! (n - k)!)
- Non-negative x1 + ... + xk = n:    C(n + k - 1, k - 1)  [Stars & Bars]`,
          takeaways: [
            "For a 64-bit hash (`M = 2^64`), a 50% collision probability occurs around `2^32 ≈ 4.3 billion` items (Birthday bound `sqrt(M)`).",
            "Use Complementary Counting (`Total - Bad`) when counting 'at least one' conditions.",
            "Pascal's Identity `C(n, k) = C(n-1, k-1) + C(n-1, k)` avoids factorial overflow in DP tables.",
          ],
        },
        {
          title: "Page 4 · Modular Arithmetic, Fermat's Little Theorem & Graph Theory",
          summary:
            "Bézout's identity, modular inverses, RSA foundations, and Euler/Bipartite graphs.",
          sections: [
            {
              heading: "Fermat's Little Theorem & Fast Modular Division",
              body: "When modulus `p` is prime and `a` is not divisible by `p`, `a^(p-1) ≡ 1 (mod p)`, which means `a^(p-2) mod p` is the multiplicative inverse of `a` modulo `p`!",
            },
            {
              heading: "Graph Degrees, Trees & Bipartite 2-Coloring",
              body: "Every tree on `V` vertices has `V - 1` edges and is acyclic and connected. By the Handshaking Lemma, the number of vertices with odd degree in any graph is always even.",
            },
          ],
          codeOrFormula: `// Modular Exponentiation (a^e mod m) in O(log e)
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let res = 1n;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) res = (res * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return res;
}`,
          takeaways: [
            "`a` has an inverse modulo `m` iff `gcd(a, m) == 1`.",
            "A connected undirected graph on `V` vertices is a tree iff it has `V - 1` edges and no cycles.",
            "Take the Practice Quiz tab to verify your MATH101 mastery.",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "Which statement is logically equivalent to the implication 'If a graph is a DAG, then it has a topological ordering' (`P -> Q`)?",
        options: [
          "If a graph has a topological ordering, then it is a DAG (`Q -> P`, the converse)",
          "If a graph is NOT a DAG, then it does NOT have a topological ordering (`¬P -> ¬Q`, the inverse)",
          "If a graph does NOT have a topological ordering, then it is NOT a DAG (`¬Q -> ¬P`, the contrapositive)",
          "A graph is a DAG and it does not have a topological ordering (`P ∧ ¬Q`)",
        ],
        correctIndex: 2,
        explanation:
          "An implication `P -> Q` is always logically equivalent to its contrapositive `¬Q -> ¬P` (and to `¬P ∨ Q`).",
        difficulty: "foundation",
      },
      {
        question: "For which value of `a` does a multiplicative inverse `a^(-1) mod 15` exist?",
        options: [
          "`a = 6` (since `gcd(6, 15) = 3`)",
          "`a = 10` (since `gcd(10, 15) = 5`)",
          "`a = 7` (since `gcd(7, 15) = 1`, and `7 × 13 = 91 ≡ 1 (mod 15)`)",
          "`a = 9` (since `gcd(9, 15) = 3`)",
        ],
        correctIndex: 2,
        explanation:
          "A modular inverse modulo `m` exists if and only if `gcd(a, m) == 1`; `gcd(7, 15) = 1` and `7 * 13 = 91 = 6*15 + 1 ≡ 1 (mod 15)`.",
        difficulty: "applied",
      },
      {
        question: "In any full binary tree with `I = 15` internal nodes (where every internal node has exactly 2 children), how many leaf nodes `L` does the tree have?",
        options: ["14 leaves", "15 leaves", "16 leaves", "30 leaves"],
        correctIndex: 2,
        explanation:
          "By structural induction on full binary trees, `L = I + 1 = 15 + 1 = 16` leaves.",
        difficulty: "applied",
      },
      {
        question: "According to the Birthday Paradox, approximately how many randomly generated 64-bit hashes (`M = 2^64` buckets) are needed before there is a >50% chance of at least one hash collision?",
        options: [
          "Only after `2^64` hashes (the Pigeonhole limit)",
          "Around `~2^32` (`sqrt(2^64) ≈ 4.3 billion`) hashes",
          "Around 64 hashes",
          "Around `2^63` hashes",
        ],
        correctIndex: 1,
        explanation:
          "Collision probability crosses 50% at `~1.177 * sqrt(M)`; for `M = 2^64`, `sqrt(2^64) = 2^32`.",
        difficulty: "challenge",
      },
    ],
  },
  {
    codeMatch: ["MATH102"],
    keywords: ["linear algebra", "matrix", "vector", "eigenvalue", "eigenvector", "svd", "pca", "dot product", "rank"],
    guide: {
      overview:
        "Linear Algebra is the mathematical engine of machine learning, computer graphics, and scientific computing: vector spaces, linear independence, matrix transformations, Rank-Nullity theorem, orthogonal projections & least squares, eigenvalues/eigenvectors, and Singular Value Decomposition (SVD / PCA).",
      keyConcepts: [
        {
          term: "Linear Independence, Span & Basis",
          explanation:
            "Vectors `v1..vk` are linearly independent if `c1*v1 + ... + ck*vk = 0` only when all `ci = 0`; a basis is a minimally spanning, linearly independent set.",
        },
        {
          term: "Rank-Nullity Theorem (`rank(A) + nullity(A) = n`)",
          explanation:
            "For an `m × n` matrix `A`, the dimension of the column space (pivot columns) plus the dimension of the nullspace (free variables where `Ax = 0`) equals the number of columns `n`.",
        },
        {
          term: "Orthogonal Projection & Normal Equations (`A^T A x = A^T b`)",
          explanation:
            "When `Ax = b` has no exact solution (`m > n`), projecting `b` onto `Col(A)` minimizes squared error `||Ax - b||_2^2` via `x_hat = (A^T A)^(-1) A^T b`.",
        },
        {
          term: "Eigenvalues & Eigenvectors (`A v = λ v`)",
          explanation:
            "Directions `v` that are only stretched by scalar `λ` under transformation `A`; symmetric matrices (`A = A^T`) have real eigenvalues and orthogonal eigenvectors (`A = Q Λ Q^T`).",
        },
        {
          term: "Singular Value Decomposition (`A = U Σ V^T`) & PCA",
          explanation:
            "Every matrix `A` decomposes into orthogonal rotation `V^T`, diagonal scaling `Σ` (`σ1 >= σ2 >= ... >= 0`), and orthogonal rotation `U`; keeping the top-k singular values gives the optimal rank-k approximation (Eckart-Young theorem).",
        },
      ],
      mentalModel:
        "Every matrix `A` is a geometric linear transformation of space: its columns tell you where the unit basis vectors land, its determinant measures volume scaling, its eigenvectors are its invariant axes of stretch, and SVD reveals the orthogonal axes carrying the most variance.",
      workedExample: `// Cosine Similarity & Orthogonal Projection of Vector b onto Vector a
function dot(a: number[], b: number[]): number {
  return a.reduce((sum, ai, i) => sum + ai * b[i], 0);
}

function projectOnto(b: number[], a: number[]): { proj: number[]; residual: number[] } {
  const scale = dot(a, b) / dot(a, a); // (a^T b) / (a^T a)
  const proj = a.map((ai) => scale * ai);
  const residual = b.map((bi, i) => bi - proj[i]); // residual is orthogonal to a: dot(residual, a) ≈ 0
  return { proj, residual };
}`,
      commonPitfalls: [
        "Explicitly inverting a matrix `inv(A) * b` in numerical code instead of solving `Ax = b` via LU/QR decomposition (matrix inversion is slower and amplifies floating-point conditioning errors).",
        "Applying PCA / SVD without mean-centering the feature columns first (`X_centered = X - mean(X)`), which causes the first principal component to simply point toward the dataset's global mean vector.",
        "Assuming matrix multiplication is commutative (`AB !== BA` in general) or that `(AB)^T` is `A^T B^T` (it reverses order: `(AB)^T = B^T A^T`).",
        "Assuming every square matrix with repeated eigenvalues is diagonalizable (defective matrices like `[[1, 1], [0, 1]]` lack a full basis of eigenvectors, whereas SVD `U Σ V^T` ALWAYS exists for every matrix).",
      ],
      practiceTask:
        "Implement Gaussian Elimination with partial pivoting, Ordinary Least Squares via QR/Normal Equations, and Power Iteration to extract the dominant eigenvector and principal component of a dataset.",
      modules: [
        {
          title: "Page 1 · Vectors, Matrices as Transformations & Rank-Nullity",
          summary:
            "Column-space geometry, Gaussian elimination pivots, and the Four Fundamental Subspaces.",
          sections: [
            {
              heading: "Matrix-Vector Multiplication as a Linear Combination of Columns",
              body: "Computing `A x` combines the columns of `A` weighted by the entries of `x`: `x1 * col1(A) + x2 * col2(A) + ...`. Therefore, `Ax = b` has a solution if and only if `b` lies in the Column Space `Col(A)`.",
            },
            {
              heading: "Rank, Pivot Columns & Nullspace",
              body: "Row-reducing `A` to Echelon Form reveals `r = rank(A)` pivot columns. The remaining `n - r` free columns span the Nullspace `N(A) = {x : Ax = 0}`, satisfying `rank(A) + dim(N(A)) = n`.",
            },
          ],
          codeOrFormula: `Strang's Four Fundamental Subspaces (for m × n matrix A of rank r):
1. Column Space Col(A) in R^m : dim = r       | Orthogonal to Left Nullspace N(A^T) (dim = m - r)
2. Row Space Col(A^T)  in R^n : dim = r       | Orthogonal to Nullspace N(A)        (dim = n - r)`,
          takeaways: [
            "Every vector in the Nullspace `N(A)` is orthogonal to every row of `A`.",
            "`(AB)^T = B^T A^T` and `(AB)^(-1) = B^(-1) A^(-1)` (order reverses!).",
            "An `n × n` matrix is invertible iff `rank(A) = n` iff `det(A) != 0` iff `0` is not an eigenvalue.",
          ],
        },
        {
          title: "Page 2 · Orthogonality, Projections & Least-Squares Regression",
          summary:
            "Deriving linear regression from geometry: projecting `b` onto `Col(A)` when `Ax = b` is overdetermined.",
          sections: [
            {
              heading: "Why the Error Vector `e = b - A x_hat` Is Perpendicular to `Col(A)`",
              body: "The closest point `p = A x_hat` in the column space of `A` to target vector `b` makes the residual `e = b - A x_hat` orthogonal to every column of `A`: `A^T (b - A x_hat) = 0`, yielding the Normal Equations `A^T A x_hat = A^T b`.",
            },
            {
              heading: "QR Decomposition (`A = Q R`) for Numerical Stability",
              body: "Forming `A^T A` squares the condition number `κ(A^T A) = κ(A)^2`, losing half the floating-point digits on ill-conditioned features. Orthogonalizing columns via Gram-Schmidt / Householder (`A = Q R`, where `Q^T Q = I`) solves `R x_hat = Q^T b` cleanly by back-substitution.",
            },
          ],
          codeOrFormula: `Normal Equations vs. QR Least Squares:
Normal Eq:  (A^T A) x_hat = A^T b          [Squares condition number κ(A)^2]
QR Method:  A = Q R  ==>  R x_hat = Q^T b  [Preserves condition number κ(A), R is upper-triangular]`,
          takeaways: [
            "Orthogonal matrices `Q` preserve vector lengths (`||Qx||_2 = ||x||_2`) and satisfy `Q^(-1) = Q^T`.",
            "In linear regression, the residual vector `y - y_hat` is always orthogonal to the feature columns.",
            "Ridge regularization `(A^T A + λI) x = A^T b` shifts eigenvalues by `+λ` so `A^T A + λI` is strictly invertible.",
          ],
        },
        {
          title: "Page 3 · Eigenvalues, Spectral Theorem & Markov Chains",
          summary:
            "Diagonalizing matrices (`A = V Λ V^(-1)`), PageRank steady states, and positive definiteness.",
          sections: [
            {
              heading: "Trace and Determinant via Eigenvalues",
              body: "For any `n × n` matrix `A` with eigenvalues `λ1..λn`, the sum of eigenvalues equals the trace (`λ1 + ... + λn = trace(A)`) and the product of eigenvalues equals the determinant (`λ1 * ... * λn = det(A)`).",
            },
            {
              heading: "Symmetric Matrices & Positive Definiteness",
              body: "By the Spectral Theorem, every real symmetric matrix `S = S^T` has real eigenvalues and an orthonormal eigenbasis `S = Q Λ Q^T`. If all `λi > 0`, `S` is Positive Definite (`x^T S x > 0` for all `x != 0`), forming a strictly convex bowl.",
            },
          ],
          codeOrFormula: `// Power Iteration to find Dominant Eigenvector v1 (largest |λ1|)
function powerIteration(A: number[][], steps = 30): number[] {
  let v = A.map(() => 1);
  for (let s = 0; s < steps; s++) {
    const Av = A.map((row) => row.reduce((acc, aij, j) => acc + aij * v[j], 0));
    const norm = Math.hypot(...Av) || 1;
    v = Av.map((x) => x / norm);
  }
  return v;
}`,
          takeaways: [
            "`trace(A) = sum(λ_i)` and `det(A) = prod(λ_i)` provide an instant sanity check on computed eigenvalues.",
            "computing `A^k x` takes seconds when diagonalized: `A^k = V Λ^k V^(-1)`.",
            "A Hessian matrix with all positive eigenvalues proves a critical point is a strict local minimum.",
          ],
        },
        {
          title: "Page 4 · Singular Value Decomposition (SVD) & PCA Dimensionality Reduction",
          summary:
            "How SVD factors ANY matrix `m × n` and powers Principal Component Analysis and low-rank compression.",
          sections: [
            {
              heading: "SVD Connects `A^T A` and `A A^T`",
              body: "In `A = U Σ V^T`, the right singular vectors `V` are orthonormal eigenvectors of `A^T A`, the left singular vectors `U` are orthonormal eigenvectors of `A A^T`, and the singular values `σ_i = sqrt(λ_i(A^T A))` measure the energy along each principal axis.",
            },
            {
              heading: "PCA Step-by-Step Pipeline",
              body: "1. Center each feature column to zero mean: `X_c = X - μ`. 2. Compute SVD `X_c = U Σ V^T`. 3. Project onto top-k right singular vectors: `Z = X_c V_k`. The fraction of variance retained is `(σ1^2 + ... + σk^2) / sum(σ_i^2)`.",
            },
          ],
          codeOrFormula: `Low-Rank Matrix Approximation (Eckart-Young Theorem):
A_k = σ1 * u1 * v1^T + σ2 * u2 * v2^T + ... + σk * uk * vk^T
Storage drops from (m * n) floats to k * (m + n + 1) floats!`,
          takeaways: [
            "Always zero-center columns (`X - mean`) before running PCA.",
            "Variance explained by Principal Component `i` is proportional to `σ_i^2`.",
            "Take the Practice Quiz tab to verify your MATH102 Linear Algebra mastery.",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "An `8 × 5` matrix `A` (8 rows, 5 columns) has rank `r = 3`. By the Rank-Nullity Theorem, what is the dimension of its nullspace `N(A) = {x ∈ R^5 : Ax = 0}`?",
        options: [
          "`dim(N(A)) = 2` (since `rank(A) + nullity(A) = number of columns = 5`, so `5 - 3 = 2`)",
          "`dim(N(A)) = 5` (since `8 - 3 = 5`)",
          "`dim(N(A)) = 3`",
          "`dim(N(A)) = 0`",
        ],
        correctIndex: 0,
        explanation:
          "The Rank-Nullity Theorem states `rank(A) + dim(N(A)) = n` (the number of columns/variables): `3 + dim(N(A)) = 5 => dim(N(A)) = 2` free variables.",
        difficulty: "foundation",
      },
      {
        question: "A `2 × 2` matrix `A` has trace `trace(A) = 7` and determinant `det(A) = 10`. What are its two eigenvalues `λ1` and `λ2`?",
        options: [
          "`λ1 = 7, λ2 = 10`",
          "`λ1 = 2, λ2 = 5` (since `2 + 5 = 7 = trace(A)` and `2 × 5 = 10 = det(A)`)",
          "`λ1 = -2, λ2 = -5`",
          "`λ1 = 1, λ2 = 10`",
        ],
        correctIndex: 1,
        explanation:
          "The sum of eigenvalues equals the trace (`2 + 5 = 7`) and the product of eigenvalues equals the determinant (`2 × 5 = 10`).",
        difficulty: "applied",
      },
      {
        question: "In Ordinary Least Squares (`min ||Ax - b||_2^2`), what is the geometric relationship between the residual error vector `e = b - A x_hat` and the Column Space `Col(A)`?",
        options: [
          "`e` lies entirely inside `Col(A)`",
          "`e` is orthogonal (perpendicular) to every column of `A`, meaning `A^T (b - A x_hat) = 0`",
          "`e` is always the zero vector `0` even when `m > n`",
          "`e` is parallel to the first column of `A`",
        ],
        correctIndex: 1,
        explanation:
          "Orthogonal projection drops a perpendicular from `b` onto `Col(A)`, so `a_i^T e = 0` for every column `a_i` of `A`, which yields the Normal Equations `A^T A x_hat = A^T b`.",
        difficulty: "applied",
      },
      {
        question: "Why does solving Least Squares via QR decomposition (`A = QR => R x_hat = Q^T b`) outperform explicitly forming `(A^T A)^(-1) A^T b` on ill-conditioned feature matrices?",
        options: [
          "Because QR decomposition works only on `1 × 1` matrices",
          "Because multiplying `A^T A` squares the matrix condition number `κ(A^T A) = κ(A)^2`, amplifying floating-point roundoff error",
          "Because `Q` is always the all-zeros matrix",
          "Because `A^T A` is never symmetric",
        ],
        correctIndex: 1,
        explanation:
          "Squaring the condition number `κ(A)^2` doubles the loss of significant digits in floating-point arithmetic; orthonormal `Q` preserves conditioning `κ(R) = κ(A)`.",
        difficulty: "challenge",
      },
    ],
  },
  {
    codeMatch: ["AI101", "AI102", "ML101", "ML102", "ML201", "ML202", "ML203", "ML301", "ML302", "ML303", "ML400"],
    keywords: ["machine learning", "artificial intelligence", "neural network", "gradient descent", "backpropagation", "regression", "classification", "transformer", "deep learning", "a* search", "overfitting"],
    guide: {
      overview:
        "AI & Machine Learning covers heuristic state-space search (A* & admissibility), probabilistic inference, supervised learning (Linear/Logistic Regression, Gradient Boosted Trees, SVMs), empirical risk minimization via Stochastic Gradient Descent & Backpropagation, regularization against overfitting, and attention/Transformer architectures.",
      keyConcepts: [
        {
          term: "A* Search & Heuristic Admissibility (`h(n) <= h*(n)`)",
          explanation:
            "Expands `f(n) = g(n) + h(n)` in a min-heap; if heuristic `h(n)` never overestimates the true remaining cost `h*(n)`, A* is guaranteed to find the optimal shortest path.",
        },
        {
          term: "Gradient Descent, Learning Rate & Loss Landscapes",
          explanation:
            "Updates parameters opposite the gradient `θ <- θ - η ∇L(θ)`; AdamW adapts per-parameter step sizes using first and second gradient moments with decoupled weight decay.",
        },
        {
          term: "Bias-Variance Trade-off & L1/L2 Regularization",
          explanation:
            "High bias underfits; high variance memorizes training noise. L2 (Ridge `λ||w||_2^2`) shrinks weights smoothly; L1 (Lasso `λ||w||_1`) drives irrelevant feature weights to exact 0 (sparse selection).",
        },
        {
          term: "Backpropagation & Vanishing/Exploding Gradients",
          explanation:
            "Applies the reverse-mode Chain Rule across computation graph layers; Residual (`x + F(x)`) skip connections and LayerNorm keep gradient norms healthy across deep networks.",
        },
        {
          term: "Scaled Dot-Product Attention (`softmax(QK^T / sqrt(d_k))V`)",
          explanation:
            "Dividing by `sqrt(d_k)` prevents large dot products from pushing `softmax` into saturated flat regions with near-zero gradients.",
        },
      ],
      mentalModel:
        "Machine learning is function approximation under generalization constraints: you define a parameterized hypothesis family, minimize a differentiable loss on training data via gradient descent, and hold out validation/test splits to ensure the model learned signal rather than memorized noise.",
      workedExample: `// Logistic Regression Binary Classifier: Forward + Analytical Gradient Step
function sigmoid(z: number): number {
  return z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
}

export function trainLogisticStep(
  X: number[][],
  y: number[],
  w: number[],
  lr = 0.05,
  l2 = 0.01,
): { wNext: number[]; loss: number } {
  const n = X.length;
  const grad = new Array(w.length).fill(0);
  let loss = 0;

  for (let i = 0; i < n; i++) {
    const z = X[i].reduce((s, xij, j) => s + xij * w[j], 0);
    const p = sigmoid(z);
    // Binary Cross-Entropy gradient: dL/dz = (p - y_i)
    const err = p - y[i];
    loss += -(y[i] * Math.log(p + 1e-12) + (1 - y[i]) * Math.log(1 - p + 1e-12));
    for (let j = 0; j < w.length; j++) grad[j] += (err * X[i][j]) / n;
  }
  const wNext = w.map((wj, j) => wj - lr * (grad[j] + l2 * wj));
  return { wNext, loss: loss / n };
}`,
      commonPitfalls: [
        "Data Leakage: fitting `StandardScaler` (mean/std) or target encoders on the ENTIRE dataset before splitting into Train/Validation/Test, leaking test distribution statistics into training.",
        "Evaluating an imbalanced binary classifier (e.g. 99% negative, 1% fraud) using raw Accuracy (a dummy model predicting 100% negative gets 99% accuracy!) instead of Precision-Recall AUC or F1.",
        "Initializing all neural network weights to the exact same constant (e.g., `0.0`), causing every hidden neuron in a layer to compute identical activations and gradients forever (symmetry problem).",
        "Applying `softmax` before Cross-Entropy loss without subtracting `max(logits)` first, causing `Math.exp(logit)` to overflow to `Infinity` (`NaN` loss).",
      ],
      practiceTask:
        "Implement vectorized Logistic Regression and a 2-layer MLP with ReLU + Cross-Entropy from scratch (including the Log-Sum-Exp numerical stability trick), and verify analytical gradients against finite-difference numerical gradients.",
      modules: [
        {
          title: "Page 1 · Search, Heuristics (A*) & Probabilistic Foundations",
          summary:
            "How A* search prunes state spaces optimally and how Bayes' theorem updates beliefs from evidence.",
          sections: [
            {
              heading: "Admissible vs. Consistent Heuristics in A* Search",
              body: "A* ranks frontier nodes by `f(n) = g(n) + h(n)`, where `g(n)` is the exact cost from start to `n` and `h(n)` estimates cost from `n` to goal. If `h(n) <= h*(n)` (admissible) and `h(u) <= cost(u, v) + h(v)` (consistent / triangle inequality), A* never re-opens a settled node and finds the optimal path while expanding minimal nodes.",
            },
            {
              heading: "Bayes' Rule & Maximum Likelihood vs. MAP",
              body: "`P(θ | D) ∝ P(D | θ) P(θ)`. Maximum Likelihood Estimation (MLE) maximizes `log P(D | θ)`. Adding a Gaussian prior `P(θ)` in Maximum A Posteriori (MAP) estimation mathematically equals L2 (Ridge) weight decay!",
            },
          ],
          codeOrFormula: `Bayes' Theorem & MAP-to-L2 Equivalence:
log P(w | D) = log P(D | w) + log P(w) - const
With Gaussian prior w ~ N(0, σ^2 I):
-log P(w | D) = CrossEntropyLoss(D, w) + (1 / (2σ^2)) * ||w||_2^2   <-- L2 Regularization!`,
          takeaways: [
            "On a 2D grid with 4-way movement, Manhattan distance `|dx| + |dy|` is an admissible heuristic; on 8-way/Euclidean space, L2 distance `hypot(dx, dy)` is admissible.",
            "L2 regularization corresponds to a Gaussian prior on weights; L1 regularization corresponds to a Laplacian prior.",
            "Always check class prior probabilities when interpreting diagnostic precision (False Positive paradox).",
          ],
        },
        {
          title: "Page 2 · Supervised Learning, Loss Functions & Regularization",
          summary:
            "Linear & Logistic Regression, Decision Trees / Gradient Boosting, and preventing data leakage.",
          sections: [
            {
              heading: "Why Classification Uses Cross-Entropy Instead of MSE",
              body: "Applying Mean Squared Error `(y - sigmoid(z))^2` to a sigmoid output multiplies the gradient by `sigmoid'(z) = p(1 - p)`, which vanishes near 0 when the model is confidently wrong (`p ≈ 0, y = 1`). Binary Cross-Entropy `-y log(p) - (1-y) log(1-p)` cancels the `p(1-p)` derivative, giving a clean linear gradient `dL/dz = p - y`!",
            },
            {
              heading: "L1 (Lasso) Sparsity vs. L2 (Ridge) Shrinkage",
              body: "The L1 penalty `λ|w|` has a constant gradient `±λ` all the way down to `w = 0` (diamond constraint corners on the axes), driving weak features to exact zero. L2 `λw^2` has gradient `2λw`, which shrinks proportionally as `w -> 0`.",
            },
          ],
          codeOrFormula: `// Numerically Stable Log-Sum-Exp & Softmax (Prevents exp() Overflow)
function stableSoftmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((z) => Math.exp(z - maxLogit));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}`,
          takeaways: [
            "Always subtract `max(logits)` before exponentiating in `softmax` or `logSumExp`.",
            "Fit preprocessing scalers/imputers ONLY on `X_train`, then apply `.transform()` to `X_val` and `X_test`.",
            "For tabular data with heterogeneous features, Gradient Boosted Decision Trees (XGBoost/LightGBM) are a strong baseline.",
          ],
        },
        {
          title: "Page 3 · Backpropagation, Optimization (AdamW) & Residual Networks",
          summary:
            "Reverse-mode automatic differentiation, He/Xavier initialization, and deep training stability.",
          sections: [
            {
              heading: "Reverse-Mode AutoDiff (Backpropagation) Efficiency",
              body: "A neural network maps millions of weights `R^P` to a single scalar loss `R^1`. Forward-mode differentiation costs `O(P)` passes; Reverse-mode backpropagation propagates `dL/d_out` backward from the scalar loss in a single backward pass (~2x the cost of one forward pass).",
            },
            {
              heading: "Residual Connections (`y = x + F(x)`) Highway",
              body: "By the chain rule, `dy/dx = 1 + dF/dx`. That additive `1` acts as an unimpeded gradient superhighway from the loss directly back to early layers, preventing vanishing gradients in 50+ layer networks.",
            },
          ],
          codeOrFormula: `Backpropagation Across a Linear Layer (Y = X W + b):
Forward:   Y = X * W + b                 (X: [B, Din], W: [Din, Dout], Y: [B, Dout])
Backward:  dL/dW = X^T * (dL/dY)         ([Din, B] * [B, Dout] -> [Din, Dout])
           dL/dX = (dL/dY) * W^T         ([B, Dout] * [Dout, Din] -> [B, Din])
           dL/db = sum_rows(dL/dY)       ([1, Dout])`,
          takeaways: [
            "Check matrix shapes on every backward equation: `dL/dW` must always have the exact same shape as `W`.",
            "Use He (`sqrt(2 / fan_in)`) initialization for ReLU layers to preserve activation variance across depth.",
            "Verify custom backward passes with Finite Differences: `(L(w + eps) - L(w - eps)) / (2 * eps)`.",
          ],
        },
        {
          title: "Page 4 · Self-Attention, Transformers & Evaluation Metrics",
          summary:
            "How Multi-Head Attention scales sequence modeling and how to evaluate models rigorously.",
          sections: [
            {
              heading: "Why Attention Divides by `sqrt(d_k)`",
              body: "If query `q` and key `k` are `d_k`-dimensional vectors with independent zero-mean, unit-variance entries, their dot product `q · k` has mean 0 and variance `d_k` (std dev `sqrt(d_k)`). Dividing by `sqrt(d_k)` restores unit variance so `softmax` doesn't collapse onto a single one-hot token with zero gradient.",
            },
            {
              heading: "Precision, Recall, F1 & ROC-AUC",
              body: "Precision = `TP / (TP + FP)` (of predicted positives, how many are real?). Recall = `TP / (TP + FN)` (of actual positives, how many did we catch?). F1 is their harmonic mean `2PR / (P + R)`.",
            },
          ],
          codeOrFormula: `Scaled Dot-Product Attention & Evaluation Metrics:
Attention(Q, K, V) = softmax((Q K^T) / sqrt(d_k) + CausalMask) V
Precision = TP / (TP + FP)   |   Recall = TP / (TP + FN)   |   F1 = 2*P*R / (P + R)`,
          takeaways: [
            "Causal decoders mask future positions (`j > i`) with `-Infinity` before `softmax` so attention weights become `0`.",
            "Self-attention over sequence length `L` has `O(L^2 * d)` compute/memory cost; KV-caching makes autoregressive token generation `O(L)` per step.",
            "Take the Practice Quiz tab to verify your AI & Machine Learning mastery.",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "What condition must a heuristic `h(n)` satisfy for A* search to be guaranteed to find the optimal shortest path?",
        options: [
          "`h(n)` must always overestimate the true remaining distance `h*(n)`",
          "`h(n)` must be admissible (`0 <= h(n) <= h*(n)`), never overestimating the true cost to the goal",
          "`h(n)` must equal `g(n)^2`",
          "`h(n)` must be negative on all nodes",
        ],
        correctIndex: 1,
        explanation:
          "An admissible heuristic never overestimates the true remaining cost, ensuring A* never prunes a suboptimal-looking prefix that could actually reach the goal more cheaply than the first goal popped.",
        difficulty: "foundation",
      },
      {
        question: "Why does Scaled Dot-Product Attention divide `Q K^T` by `sqrt(d_k)` before applying `softmax`?",
        options: [
          "To convert matrices into integers",
          "Because for unit-variance vectors of dimension `d_k`, the dot product variance grows as `d_k`; scaling by `1/sqrt(d_k)` keeps variance at 1 so `softmax` does not saturate with near-zero gradients",
          "To delete the Value matrix `V`",
          "To make the sequence length `L` equal to 1",
        ],
        correctIndex: 1,
        explanation:
          "Without `1/sqrt(d_k)`, large `d_k` produces extreme dot products that push `softmax` into flat one-hot saturation where gradients vanish.",
        difficulty: "applied",
      },
      {
        question: "You fit `StandardScaler` (`mean` and `std`) on your entire dataset `X` BEFORE calling `train_test_split(X, y)`. What error did you introduce?",
        options: [
          "Underflow error",
          "Data Leakage: test-set distribution statistics leaked into training normalization, producing overly optimistic validation/test metrics",
          "Vanishing gradient",
          "Syntax error in matrix multiplication",
        ],
        correctIndex: 1,
        explanation:
          "All preprocessing statistics (mean, variance, vocabulary, target encoding) must be fit exclusively on the training split and applied unchanged to validation and test splits.",
        difficulty: "applied",
      },
      {
        question: "For a linear layer `Y = X W` where batch input `X` has shape `[B, D_in]`, weights `W` have shape `[D_in, D_out]`, and upstream gradient `dL/dY` has shape `[B, D_out]`, what is the formula for `dL/dW`?",
        options: [
          "`X^T @ (dL/dY)` resulting in shape `[D_in, D_out]`",
          "`(dL/dY) @ X` resulting in shape `[B, B]`",
          "`W @ X^T`",
          "`X + (dL/dY)`",
        ],
        correctIndex: 0,
        explanation:
          "By the matrix chain rule (and dimensional analysis), `X^T` (`[D_in, B]`) multiplied by `dL/dY` (`[B, D_out]`) contracts over the batch dimension `B` and yields `[D_in, D_out]`, matching `W`.",
        difficulty: "challenge",
      },
    ],
  },
  {
    codeMatch: ["WEB101", "WEB102", "FSW101", "FSW102", "FSW201", "FSW202", "FSW203", "FSW301", "FSW302", "FSW303", "FSW400"],
    keywords: ["web", "html", "css", "javascript", "typescript", "react", "next.js", "dom", "frontend", "full-stack", "api", "rest"],
    guide: {
      overview:
        "Web & Full-Stack Engineering covers the browser rendering pipeline (DOM, CSSOM, Layout, Paint, Composite), semantic accessibility (ARIA & keyboard focus), Event Loop concurrency (microtasks vs. macrotasks), React/Next.js Server & Client Component architecture, HTTP caching (`Cache-Control`, `ETag`), and secure API authentication.",
      keyConcepts: [
        {
          term: "Event Loop, Call Stack & Microtask Queue",
          explanation:
            "JavaScript runs single-threaded on the call stack; resolved Promises (`then`/`await`) flush completely in the Microtask Queue before the browser processes the next Macrotask (`setTimeout`, I/O) or repaints.",
        },
        {
          term: "Browser Rendering Pipeline & Layout Thrashing",
          explanation:
            "Interleaving DOM style writes and geometric reads (`offsetHeight`, `getBoundingClientRect`) inside a loop forces synchronous reflows; `transform` and `opacity` animate on the GPU compositor without layout or paint.",
        },
        {
          term: "Event Bubbling, Capturing & Delegation",
          explanation:
            "DOM events travel down in the Capture phase and bubble up through ancestors; attaching one delegated listener on a container handles dynamic children and reduces memory overhead.",
        },
        {
          term: "React Reconciliation, Fiber & Stale Closures",
          explanation:
            "State updates schedule declarative re-renders keyed by component identity and list `key` props; effect and event callbacks capture the render snapshot they were created in unless dependencies are updated.",
        },
        {
          term: "HTTP Caching (`Cache-Control`, `ETag`, `304 Not Modified`)",
          explanation:
            "Content-hashed assets use `Cache-Control: public, max-age=31536000, immutable`; dynamic API responses use `ETag` + `If-None-Match` conditional validation.",
        },
      ],
      mentalModel:
        "A full-stack web application is a distributed state synchronization pipeline: the server owns durable truth and access control in PostgreSQL, HTTP headers govern caching and authentication boundaries, and the browser coordinates async UI updates within a 16.6ms (60fps) frame budget.",
      workedExample: `// Debounced Abortable Search Fetch (Prevents Race-Condition Stale Responses)
useEffect(() => {
  if (!query.trim()) return;
  const controller = new AbortController();
  const timer = setTimeout(async () => {
    try {
      const res = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      setResults(await res.json());
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError("Search failed");
    }
  }, 250);

  return () => {
    clearTimeout(timer);
    controller.abort(); // cancels in-flight older request if user types again!
  };
}, [query]);`,
      commonPitfalls: [
        "Firing `fetch()` inside a `useEffect` on search input changes without an `AbortController` cleanup, allowing an older slow network response to arrive AFTER a newer fast response and overwrite the UI with stale data.",
        "Using array index `key={idx}` on dynamic reorderable or filterable React lists, causing input focus and component state to stay attached to the wrong item when rows shift.",
        "Trusting client-side UI hides or JWT claims without re-verifying session signatures and resource ownership (`WHERE user_id = $sessionUserId`) on the backend API route.",
        "Reading `el.offsetWidth` immediately after writing `el.style.width` inside a loop (Forced Synchronous Layout / Layout Thrashing).",
      ],
      practiceTask:
        "Build a full-stack paginated, filterable data workbench with debounced `AbortController` fetching, optimistic UI updates with rollback on server error, full keyboard navigation (`tablist`/`Escape`), and `ETag` conditional caching.",
      modules: [
        {
          title: "Page 1 · Browser Rendering Pipeline, DOM Events & Accessibility",
          summary:
            "How HTML/CSS become pixels at 60fps, event propagation phases, and semantic ARIA contracts.",
          sections: [
            {
              heading: "DOM + CSSOM -> Render Tree -> Layout -> Paint -> Composite",
              body: "Mutating geometric properties (`width`, `top`, `margin`) triggers Layout (Reflow) + Paint + Composite. Mutating `background-color` skips Layout and triggers Paint + Composite. Mutating `transform` and `opacity` runs directly on the compositor thread without blocking the main thread.",
            },
            {
              heading: "Semantic HTML & Keyboard Focus Management",
              body: "Native `<button>`, `<input>`, and `<select>` provide built-in keyboard handling (`Enter`/`Space`), focus rings, and accessibility-tree roles. Custom interactive widgets must declare `role`, `aria-selected`/`aria-expanded`, and handle `Escape` and arrow keys.",
            },
          ],
          codeOrFormula: `Event Propagation Order on DOM Tree:
1. Capture Phase:  window -> document -> <main> -> <ul>  (addEventListener(type, fn, { capture: true }))
2. Target Phase:   <button> clicked
3. Bubble Phase:   <button> -> <li> -> <ul> -> <main> -> document -> window`,
          takeaways: [
            "Animate `transform` and `opacity` rather than `top`/`left`/`width`/`height`.",
            "Batch all DOM measurement reads together before performing any DOM style writes.",
            "`event.stopPropagation()` stops upward bubbling; `event.preventDefault()` cancels default browser action (like form page reload).",
          ],
        },
        {
          title: "Page 2 · The JavaScript Event Loop, Promises & Async Concurrency",
          summary:
            "Call stack execution, microtasks vs. macrotasks, `Promise.all` parallelization, and cancellation.",
          sections: [
            {
              heading: "Why Promise Microtasks Run Before `setTimeout(..., 0)`",
              body: "After the synchronous call stack empties, the JS runtime drains the entire Microtask Queue (`Promise.then`, `queueMicrotask`, `await` continuations) until empty—including any new microtasks queued during draining—before picking a single Macrotask (`setTimeout`, `setInterval`, I/O) or yielding to `requestAnimationFrame`.",
            },
            {
              heading: "Eliminating Sequential `await` Waterfalls",
              body: "Awaiting two independent database queries sequentially (`const a = await getA(); const b = await getB();`) sums their network latencies (`T_a + T_b`). Starting both concurrently with `const [a, b] = await Promise.all([getA(), getB()])` reduces latency to `max(T_a, T_b)`.",
            },
          ],
          codeOrFormula: `// Execution Order Trace:
console.log("1: sync start");
setTimeout(() => console.log("4: macrotask timeout"), 0);
Promise.resolve().then(() => console.log("3: microtask promise"));
console.log("2: sync end");
// Output order is deterministically: 1 -> 2 -> 3 -> 4`,
          takeaways: [
            "Use `Promise.all` (or `Promise.allSettled`) for independent async operations to avoid sequential waterfalls.",
            "An infinite loop of `queueMicrotask` or `Promise.resolve().then(...)` starves the browser from ever repainting the screen.",
            "Always wire `AbortController.signal` into `fetch()` requests triggered by user navigation or typing.",
          ],
        },
        {
          title: "Page 3 · React & Next.js Architecture: Reconciliation, Server & Client Components",
          summary:
            "How React diffs virtual trees, avoids stale closures, and splits server data fetching from client interactivity.",
          sections: [
            {
              heading: "Stable List Keys & Fiber State Preservation",
              body: "React matches children across renders by their `type` and `key`. Using a stable database ID (`key={course.id}`) lets React move or delete the exact DOM node; using `key={index}` tricks React into keeping old local state when an item is inserted or deleted at the start of the array.",
            },
            {
              heading: "React Server Components (RSC) vs. Client Components (`\"use client\"`)",
              body: "Server Components execute exclusively on the server—they can query Prisma/PostgreSQL directly with zero client JS bundle cost and never expose server environment variables. Client Components (`\"use client\"`) hydrate in the browser to manage interactive state (`useState`, `useEffect`, React Flow canvas).",
            },
          ],
          codeOrFormula: `// Avoiding Stale Closures in Functional State Updates
// Buggy if called twice in one event or inside an interval with [] deps:
//   setCount(count + 1);
// Correct (always receives latest queued state):
setCount((prev) => prev + 1);`,
          takeaways: [
            "Derive computed values during render (`useMemo` when expensive) rather than duplicating them in `useState` + `useEffect`.",
            "Never pass secret API keys (`GEMINI_API_KEY`) as props to a `\"use client\"` component—keep AI calls inside server Route Handlers.",
            "Use functional updaters `setState(prev => ...)` whenever next state depends on previous state.",
          ],
        },
        {
          title: "Page 4 · API Design, Auth Sessions, Rate Limiting & HTTP Caching",
          summary:
            "Designing resilient REST/JSON endpoints, session security, and caching headers.",
          sections: [
            {
              heading: "Idempotent HTTP Methods & Status Codes",
              body: "`GET`, `HEAD`, `PUT`, and `DELETE` are idempotent (repeating the exact request leaves server state identical); `POST` is not idempotent unless guarded by an `Idempotency-Key`. Use `400` for validation errors, `401` for unauthenticated, `403` for unauthorized, `429` for rate limit exceeded, and `502` for upstream gateway failure.",
            },
            {
              heading: "Session Cookies & Password Hashing",
              body: "Store session tokens in `HttpOnly; Secure; SameSite=Lax` cookies so malicious third-party scripts cannot read them via `document.cookie`, and hash passwords with `scrypt` or `Argon2id` + random salt.",
            },
          ],
          codeOrFormula: `HTTP Caching Headers Architecture:
1. Hashed Static Bundles (/_next/static/*):
   Cache-Control: public, max-age=31536000, immutable
2. Personalized Authenticated API (/api/auth/me):
   Cache-Control: private, no-store`,
          takeaways: [
            "Validate every request body on the server even if the client form already validates it.",
            "Return `429 Too Many Requests` with graceful fallback data when upstream AI quotas are exceeded.",
            "Take the Practice Quiz tab to verify your Web & Full-Stack Engineering mastery.",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "In what order does the JavaScript runtime execute the following: synchronous code on the call stack, a resolved `Promise.then` callback, and a `setTimeout(fn, 0)` callback?",
        options: [
          "1. Synchronous code -> 2. `setTimeout(fn, 0)` -> 3. `Promise.then`",
          "1. Synchronous code -> 2. `Promise.then` (Microtask Queue drains completely) -> 3. `setTimeout(fn, 0)` (next Macrotask)",
          "1. `Promise.then` -> 2. Synchronous code -> 3. `setTimeout(fn, 0)`",
          "They run in random order on separate OS threads",
        ],
        correctIndex: 1,
        explanation:
          "After synchronous stack execution completes, the Event Loop drains all queued Microtasks (`Promise.then`, `await`) before picking the next Macrotask (`setTimeout`).",
        difficulty: "foundation",
      },
      {
        question: "Why should a `useEffect` that fetches search results as the user types return a cleanup function that calls `controller.abort()` on an `AbortController`?",
        options: [
          "To prevent an earlier, slower network request from resolving AFTER a newer request and overwriting the UI with stale search results",
          "Because `fetch()` refuses to run without an `AbortController`",
          "To clear `localStorage` on every keystroke",
          "To disable CORS checks in the browser",
        ],
        correctIndex: 0,
        explanation:
          "Network responses can arrive out of order; aborting the superseded request in the effect cleanup guarantees only the latest query updates state.",
        difficulty: "applied",
      },
      {
        question: "Why does using array index `key={index}` on a dynamic React list cause bugs when items are prepended, deleted, or reordered?",
        options: [
          "React uses `key` to match component instances across renders; when indices shift, React reuses the old component state and DOM focus at index 0 for the new item at index 0",
          "Because numeric keys are invalid JSX syntax",
          "Because `key={index}` disables CSS styling",
          "Because arrays in JavaScript are 1-indexed",
        ],
        correctIndex: 0,
        explanation:
          "Keying by array position ties identity to index rather than data item, mixing up uncontrolled inputs, focus, and local state when items move.",
        difficulty: "applied",
      },
      {
        question: "Two independent database queries `getUser(id)` (30ms) and `getCourses()` (40ms) are needed in a Server Component. What is the latency difference between awaiting them sequentially versus using `await Promise.all([getUser(id), getCourses()])`?",
        options: [
          "Sequential takes ~70ms (`30 + 40`); `Promise.all` runs both in flight concurrently and finishes in ~40ms (`max(30, 40)`)",
          "Both take 70ms because Promises are synchronous",
          "`Promise.all` takes 1200ms",
          "Sequential is faster because it uses fewer TCP packets",
        ],
        correctIndex: 0,
        explanation:
          "Sequential `await` waits for the first I/O round-trip to finish before starting the second; `Promise.all` dispatches both I/O requests immediately in parallel.",
        difficulty: "challenge",
      },
    ],
  },
  {
    codeMatch: ["CAP500"],
    keywords: ["capstone", "system design", "production", "deployment", "profiling", "benchmark", "architecture"],
    guide: {
      overview:
        "The Capstone Project integrates multi-service system design, Go + Next.js + PostgreSQL architecture, containerized deployment (`CGO_ENABLED=0` multi-stage Docker), CPU/memory profiling (`pprof`), automated CI/CD verification, and live latency benchmarking.",
      keyConcepts: [
        {
          term: "Service Boundary Isolation & JSON Contract",
          explanation:
            "Decouples the stateless compute-intensive Go Pareto optimizer (`POST /api/v1/optimize`) from the Next.js web/AI/database tier via strict schema validation and timeouts.",
        },
        {
          term: "Multi-Stage Static Go Docker Builds (`CGO_ENABLED=0`)",
          explanation:
            "Compiles the Go binary in a `golang:alpine` builder stage and copies only the static binary into a minimal `alpine`/`distroless` runtime image (< 25 MB) with non-root execution.",
        },
        {
          term: "Database-Backed AI Response Caching",
          explanation:
            "Hashes `(kind, prompt)` with SHA-256 into PostgreSQL (`AiResponseCache`) so repeated curriculum, study guide, and quiz requests return in < 10ms without exhausting Gemini API quotas.",
        },
        {
          term: "CPU & Heap Profiling (`runtime/pprof` & Benchmarks)",
          explanation:
            "Replaces string hash-map allocations in hot graph loops with dense `0..N-1` integer arrays and arena parent pointers to eliminate GC pressure.",
        },
        {
          term: "Graceful Degradation & Rate Limiting",
          explanation:
            "Enforces request size limits (1 MB), context timeouts, HTTP 429 rate limiting, and deterministic fallbacks so the system stays operational even when external services degrade.",
        },
      ],
      mentalModel:
        "A capstone engineering system is judged by three pillars: algorithmic rigor (provably non-dominated Pareto paths), operational resilience (caching, timeouts, graceful fallbacks), and measurable performance (sub-millisecond Go graph solver vs. interpreted baselines).",
      workedExample: `# Multi-Stage Production Dockerfile for Go Optimizer (< 20 MB image)
FROM golang:1.25-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/optimizer ./cmd/optimizer

FROM alpine:3.21
RUN adduser -D -u 10001 appuser
USER appuser
COPY --from=builder /out/optimizer /usr/local/bin/optimizer
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/optimizer"]`,
      commonPitfalls: [
        "Shipping the full `golang` SDK compiler image (~800 MB) to production instead of a multi-stage build copying only the static binary (< 25 MB).",
        "Calling external LLM APIs synchronously without a database cache or fallback, causing demo failures under rate limits (HTTP 429).",
        "Allocating new string slices on every intermediate hop of a graph search instead of reconstructing paths only for the surviving Pareto frontier.",
        "Leaving HTTP servers without `ReadTimeout`, `WriteTimeout`, and `http.MaxBytesReader` body limits.",
      ],
      practiceTask:
        "Run the end-to-end Capstone verification checklist: execute `go test -bench=. -benchmem ./...` on the Go optimizer, verify the SHA-256 PostgreSQL AI cache hit path, and rehearse the 5-minute architecture defense.",
      modules: [
        {
          title: "Page 1 · End-to-End System Architecture & Service Contracts",
          summary:
            "How Next.js, the Go Pareto Engine, Neon PostgreSQL, and Gemini coordinate cleanly.",
          sections: [
            {
              heading: "Why Split the Optimizer into a Dedicated Go Service?",
              body: "Multi-objective Pareto label-setting over 500-node DAGs is CPU- and allocation-intensive. Isolating it in Go gives deterministic sub-millisecond latency, compact value-type slices, and independent horizontal scaling separate from Next.js SSR and AI I/O.",
            },
            {
              heading: "Request Validation & Fault Boundaries",
              body: "The Go HTTP handler enforces `http.MaxBytesReader` (1 MB payload cap), cycle detection via topological sort (`gonum/graph/topo`), and context deadlines before running `RunPareto`.",
            },
          ],
          codeOrFormula: `Architecture Data Flow:
[ Browser React Flow UI ]
   ├── POST /api/optimizer  --> [ Go Pareto Engine :8080 ] (0..N-1 Arena Label-Setting)
   └── POST /api/node-summary / quiz --> [ SHA-256 Neon DB Cache ] <--> [ Gemini Flash ]`,
          takeaways: [
            "Keep the Go optimizer 100% stateless so any number of container instances can sit behind a load balancer.",
            "Validate DAG acyclicity and non-negative costs before running pathfinding.",
            "Use SHA-256 prompt hashing in PostgreSQL to guarantee deterministic, zero-cost repeat demos.",
          ],
        },
        {
          title: "Page 2 · Algorithmic Optimization & `pprof` Memory Engineering",
          summary:
            "How the Go Pareto engine achieves zero intermediate string-slice allocations.",
          sections: [
            {
              heading: "Dense Integer Indexing (`0..N-1`) & Flat Adjacency Storage",
              body: "String map lookups (`map[string][]Edge`) inside the inner propagation loop dominate CPU time and pointer chasing. Mapping course IDs once to `0..N-1` integers and packing all outgoing neighbors into a single contiguous `adjStorage []int` slice keeps the hot loop in L1 cache.",
            },
            {
              heading: "Parent-Pointer Path Arena (`pathStep`)",
              body: "Instead of cloning a `[]string` path at every intermediate label propagation step, each label stores an integer index into a flat `steps []pathStep{nodeIdx, parent}` arena. Full `[]string` paths are materialized only at the very end for surviving global Pareto labels.",
            },
          ],
          codeOrFormula: `// Arena Back-Pointer Path Materialization (Only runs on surviving frontier!)
func materializePath(stepIdx, depth int, steps []pathStep, courses []CourseNode) []string {
    path := make([]string, depth)
    for pos, curr := depth-1, stepIdx; pos >= 0 && curr >= 0; pos-- {
        path[pos] = courses[steps[curr].nodeIdx].ID
        curr = steps[curr].parent
    }
    return path
}`,
          takeaways: [
            "Replacing string maps with `0..N-1` slice indexing and an arena cuts heap allocations by >85%.",
            "Backward target-cone reachability pruning skips entire branches that cannot reach the target milestone.",
            "Cap per-node frontiers at `MaxLabelsPerNode = 500` to bound worst-case dense-graph growth.",
          ],
        },
        {
          title: "Page 3 · Containerization, Security Hardening & Cloud Deployment",
          summary:
            "Multi-stage Docker builds, least-privilege containers, and environment configuration.",
          sections: [
            {
              heading: "Static Binary Compilation (`CGO_ENABLED=0`)",
              body: "Disabling CGO links pure Go networking and crypto without glibc dynamic library dependencies, allowing the binary to run inside a 5 MB Alpine or Distroless container as an unprivileged user (`UID 10001`).",
            },
            {
              heading: "Secrets & Environment Hygiene",
              body: "`GEMINI_API_KEY`, `GEMINI_MODEL_ID`, and `DATABASE_URL` are loaded strictly from server environment variables—never hardcoded or exposed in `NEXT_PUBLIC_*` client bundles.",
            },
          ],
          codeOrFormula: `# Run Go Benchmarks with Memory Allocation Telemetry
cd services/optimizer && go test -bench=. -benchmem ./internal/pareto/...`,
          takeaways: [
            "Strip debug symbols with `-ldflags=\"-s -w\"` to shrink binary size by ~30%.",
            "Never run production containers as `root`.",
            "Verify `/healthz` readiness probes before routing traffic during rolling deploys.",
          ],
        },
        {
          title: "Page 4 · Capstone Defense Checklist & Live Demo Guide",
          summary:
            "Key questions and answers for your capstone presentation and live demonstration.",
          sections: [
            {
              heading: "Defense Q&A: Why Pareto Front Instead of a Single Weighted Sum?",
              body: "A weighted sum `w1*Hours + w2*Difficulty` requires guessing arbitrary weights upfront and can only find points on the convex hull of the trade-off curve. Pareto label-setting discovers ALL non-dominated routes (including non-convex trade-offs) in a single pass, letting the learner compare Express vs. Deep Mastery visually.",
            },
            {
              heading: "Closed-Loop Mastery Verification",
              body: "Completing a diagnostic quiz with `>= 75%` score automatically marks the course verified & completed, sets its remaining study cost to `0`, and re-triggers the Go Pareto engine to re-optimize the remaining path live.",
            },
          ],
          codeOrFormula: `Capstone Demo Flow (3 Minutes):
1. Select Target Milestone (CAP500) & compare Express (#E76F51) vs Deep Mastery (#36BA98)
2. Open Pareto Frontier Chart to inspect non-dominated trade-off curve
3. Click any course -> review 4-Page Study Guide -> score >= 75% on Quiz
4. Observe live Go engine re-optimization as completed course cost drops to 0h`,
          takeaways: [
            "Pareto label-setting finds non-convex trade-offs that scalar weighted-sum Dijkstra misses.",
            "Strict final Pareto pruning guarantees zero dominated routes in `pareto_frontier`.",
            "Take the Practice Quiz tab to verify your CAP500 mastery!",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "Why does Paretoium use a multi-objective Pareto label-setting algorithm instead of collapsing hours and difficulty into a single weighted sum `0.5*Hours + 0.5*Difficulty` with standard Dijkstra?",
        options: [
          "Because Dijkstra's algorithm cannot run on directed graphs",
          "A single weighted sum forces an arbitrary weight ratio upfront and cannot discover non-convex Pareto-optimal trade-offs, whereas label-setting surfaces the full frontier of non-dominated routes in one pass",
          "Because weighted sums always produce cycles",
          "Because Go does not support floating-point multiplication",
        ],
        correctIndex: 1,
        explanation:
          "Linear scalarization only finds a single point on the lower convex hull for a fixed weight; Pareto label-setting retains the entire set of non-dominated trade-off paths.",
        difficulty: "foundation",
      },
      {
        question: "In the Go Pareto engine (`pareto.go`), how does the `pathStep` parent-pointer arena reduce garbage-collection pressure during label propagation?",
        options: [
          "By writing every intermediate path to disk",
          "By storing lightweight `{nodeIdx, parentIdx}` integer structs during propagation and allocating `[]string` slices only once at the end for surviving frontier labels",
          "By limiting all paths to a maximum length of 1 node",
          "By disabling Go's garbage collector completely",
        ],
        correctIndex: 1,
        explanation:
          "Cloning `[]string` slices at every intermediate hop causes `O(depth)` heap allocations per label; the flat integer arena defers string slice creation until the final surviving frontier.",
        difficulty: "applied",
      },
      {
        question: "Why do we compile the Go optimizer with `CGO_ENABLED=0` in a multi-stage Dockerfile?",
        options: [
          "To produce a statically linked binary that runs in a minimal `< 25 MB` Alpine/Distroless runtime image without shipping the 800 MB Go compiler toolchain",
          "Because `CGO_ENABLED=0` automatically generates a Next.js frontend",
          "To allow the container to run as `root` with host kernel privileges",
          "To disable HTTP endpoints",
        ],
        correctIndex: 0,
        explanation:
          "Multi-stage builds with `CGO_ENABLED=0` leave the Go SDK behind in the builder stage and ship only the self-contained static executable.",
        difficulty: "applied",
      },
      {
        question: "What happens in the closed-loop optimization flow when a student scores `>= 75%` on a course's Diagnostic Quiz?",
        options: [
          "The course is deleted from the prerequisite graph",
          "The course is marked verified and completed, its remaining `study_hours` and `difficulty` costs become `0`, and the Go optimizer recomputes the Pareto frontier for the remaining courses",
          "All constraints reset to 0",
          "The database cache is wiped",
        ],
        correctIndex: 1,
        explanation:
          "Completed courses contribute `0` remaining cost while satisfying prerequisite edges for downstream courses, dynamically updating the optimal remaining route.",
        difficulty: "challenge",
      },
    ],
  },
  {
    codeMatch: ["ENG101", "ENG102", "ENG201", "ENG202", "ENG203", "ENG301", "ENG302", "ENG303", "ENG400"],
    keywords: ["english", "grammar", "vocabulary", "writing", "literature", "rhetoric", "essay", "syntax", "punctuation", "clause", "reading comprehension"],
    guide: {
      overview:
        "English Language, Composition & Rhetoric builds mastery across sentence syntax, precise vocabulary and collocations, paragraph coherence, persuasive essay argumentation, and close literary analysis.",
      keyConcepts: [
        {
          term: "Independent vs. Dependent Clauses & Coordination",
          explanation:
            "An independent clause has a subject and finite verb and can stand alone. Joining two independent clauses requires a comma + coordinating conjunction (FANBOYS), a semicolon, or a period—never a bare comma (comma splice).",
        },
        {
          term: "Active Voice vs. Nominalization",
          explanation:
            "Active prose puts the doer in the subject position and the action in a vivid verb ('The committee approved the policy'), avoiding heavy noun-heavy passive constructions ('Approval of the policy was conducted by the committee').",
        },
        {
          term: "Modifier Placement & Dangling Participles",
          explanation:
            "An introductory participial phrase ('Walking down the street, ...') must immediately precede the grammatical subject performing that action.",
        },
        {
          term: "Paragraph Unity, Topic Sentences & Old-to-New Flow",
          explanation:
            "Strong paragraphs open with a clear claim, begin each sentence with familiar context from the previous sentence, and end each sentence with the high-impact new information.",
        },
        {
          term: "Rhetorical Appeals (Ethos, Logos, Pathos) & Concession",
          explanation:
            "Persuasive essays establish credibility (ethos), structured evidence (logos), and resonance (pathos), while steel-manning and refuting the strongest counterargument.",
        },
      ],
      mentalModel:
        "Think of an English sentence as a clear camera shot: the grammatical subject is who the camera follows, the main verb is what they do, and subordinate clauses provide background framing without stealing focus.",
      workedExample: `Annotated Sentence & Paragraph Revision Walkthrough:

1. Fixing a Dangling Modifier:
   ✗ Flawed:  "Having finished the research paper, the bibliography was formatted."
              (Implies the bibliography finished the research paper!)
   ✓ Revised: "Having finished the research paper, Maya formatted the bibliography."

2. Eliminating Comma Splice & Nominalization:
   ✗ Flawed:  "The data was inconclusive, however, an expansion of the study was recommended by the authors."
   ✓ Revised: "The data remained inconclusive; however, the authors recommended expanding the study."

3. Parallel Grammatical Structure:
   ✗ Flawed:  "Effective writers value clarity, conciseness, and being accurate."
   ✓ Revised: "Effective writers value clarity, conciseness, and accuracy."`,
      commonPitfalls: [
        "Comma Splice: joining two complete sentences with only a comma (e.g., 'She studied all night, however, she still felt tired') instead of a semicolon (`; however,`) or coordinating conjunction.",
        "Dangling Modifier: writing an opening modifier whose implied actor is not the subject right after the comma.",
        "Subject-Verb Agreement across prepositional phrases: writing 'The collection of rare manuscripts WERE lost' instead of 'WAS lost' (the singular head noun is 'collection').",
        "Summarizing plot events sequentially instead of making an arguable interpretive thesis supported by textual evidence.",
      ],
      practiceTask:
        "Write and revise a 4-paragraph persuasive essay: 1) Hook + arguable thesis statement, 2) Primary evidence paragraph using the Old-to-New cohesion rule, 3) Counterargument concession and rebuttal, and 4) Synthesis conclusion—checking every sentence for comma splices, passive nominalizations, and modifier alignment.",
      modules: [
        {
          title: "Page 1 · Sentence Architecture, Clauses & Punctuation Rules",
          summary:
            "How English sentences combine independent and subordinate clauses without fragments, run-ons, or comma splices.",
          sections: [
            {
              heading: "The Four Sentence Structures",
              body: "1. Simple: one independent clause ('The train arrived on time.'). 2. Compound: two independent clauses joined by `, + FANBOYS` (for, and, nor, but, or, yet, so) or a semicolon `;`. 3. Complex: one independent clause + one or more dependent clauses ('Although rain fell, the match continued.'). 4. Compound-Complex: two independent clauses + at least one dependent clause.",
            },
            {
              heading: "Restrictive vs. Non-Restrictive Clauses (`that` vs. `, which`)",
              body: "A restrictive clause narrows identity and takes no commas: 'The book that I borrowed yesterday is due.' A non-restrictive clause adds bonus information to an already-identified noun and is set off by commas: 'My favorite novel, which won the Booker Prize, is out of print.'",
            },
          ],
          codeOrFormula: `Punctuation Decision Table for Joining Two Complete Clauses (Clause A + Clause B):
1. Clause A, and/but/so Clause B.       [Comma + Coordinating Conjunction (FANBOYS)]
2. Clause A; Clause B.                  [Semicolon alone between closely related ideas]
3. Clause A; however, Clause B.         [Semicolon + Conjunctive Adverb + Comma]
4. ✗ Clause A, Clause B.                [COMMA SPLICE ERROR — never join with a bare comma!]`,
          takeaways: [
            "`however`, `therefore`, and `moreover` are conjunctive adverbs, NOT coordinating conjunctions—precede them with a semicolon or period when joining two clauses.",
            "Match the verb to the head noun of the subject, ignoring intervening `of ...` prepositional phrases.",
            "Use `that` (no comma) for essential restrictive clauses and `, which` (with comma) for non-essential clauses.",
          ],
        },
        {
          title: "Page 2 · Clarity, Active Voice, Parallelism & Precision Vocabulary",
          summary:
            "Transforming wordy, abstract prose into crisp, energetic, and idiomatic English.",
          sections: [
            {
              heading: "Turning Zombie Nouns (Nominalizations) Back into Verbs",
              body: "Academic and bureaucratic prose often buries actions inside abstract `-tion`/`-ment`/`-ance` nouns paired with weak verbs (`make a decision`, `conduct an investigation`, `provide an explanation`). Restoring the verb (`decide`, `investigate`, `explain`) cuts word count by 30–40% and sharpens agency.",
            },
            {
              heading: "Parallelism in Lists and Correlative Conjunctions",
              body: "Items in a series or paired with `not only ... but also ...`, `either ... or ...`, and `both ... and ...` must share the exact same grammatical form (all nouns, all infinitive verbs, or all `-ing` gerunds).",
            },
          ],
          codeOrFormula: `Before & After Prose Tightening Examples:
- Wordy (14 words):  "An evaluation of the proposal was performed by the board prior to its rejection."
- Crisp (7 words):   "The board evaluated and rejected the proposal."

- Broken Correlative: "She not only excelled in writing poetry, but also essays."
- Parallel Fixed:     "She excelled in writing not only poetry, but also essays."`,
          takeaways: [
            "Put characters in subjects and actions in verbs.",
            "Keep passive voice only when the actor is unknown, irrelevant, or deliberately placed at the end for emphasis.",
            "Verify that whatever grammatical form follows `not only` also immediately follows `but also`.",
          ],
        },
        {
          title: "Page 3 · Paragraph Cohesion, Transitions & Rhetorical Argumentation",
          summary:
            "Structuring paragraphs and persuasive essays so ideas flow effortlessly from sentence to sentence.",
          sections: [
            {
              heading: "The Old-to-New Information Principle (Known-New Contract)",
              body: "Readers feel a paragraph is 'choppy' when every sentence begins with a brand-new, unintroduced topic. Start each sentence with a word or concept that echoes the end of the previous sentence (Old Information), then introduce the new claim at the end of the sentence (Stress Position).",
            },
            {
              heading: "Crafting an Arguable Thesis Statement",
              body: "A true thesis is neither a statement of obvious fact ('Shakespeare wrote Hamlet around 1600') nor a vague topic announcement ('This essay examines social media'). A strong thesis makes a specific, contestable claim backed by a 'because/by' reasoning clause.",
            },
          ],
          codeOrFormula: `Old-to-New Cohesion Chain Example:
Sentence 1: "Modern cities rely heavily on underground [aquifer systems]."
Sentence 2: "[These aquifers] replenish slowly over decades through [porous limestone]."
Sentence 3: "[When that limestone] is sealed by concrete sprawl, water tables collapse."`,
          takeaways: [
            "Open each sentence with familiar context and close it with the words deserving the strongest emphasis.",
            "Test your thesis by asking: 'Could a reasonable reader disagree with this claim?'",
            "Include a Concession + Rebuttal paragraph (`While critics argue X, closer examination reveals Y`) to strengthen ethos.",
          ],
        },
        {
          title: "Page 4 · Close Reading, Literary Devices & Revision Checklist",
          summary:
            "Analyzing tone, metaphor, and subtext in literature and non-fiction, plus a final editing protocol.",
          sections: [
            {
              heading: "Close Reading: Diction, Syntax & Figurative Language",
              body: "When analyzing a text, move beyond *what* the author says to *how* the formal choices construct meaning: examine connotation (why 'gaunt' instead of 'thin'?), sentence rhythm (abrupt staccato clauses vs. periodic sentences), and extended metaphor.",
            },
            {
              heading: "Three-Pass Revision Protocol",
              body: "Pass 1 (Structural): Does every paragraph advance the thesis? Pass 2 (Sentence Rhythm & Clarity): Replace nominalizations and fix Old-to-New transitions. Pass 3 (Proofreading): Check comma splices, dangling modifiers, and pronoun-antecedent agreement.",
            },
          ],
          codeOrFormula: `Close-Reading Analytical Paragraph Template (Claim -> Evidence -> Analysis):
1. Claim:    State the specific rhetorical or thematic effect of the passage.
2. Evidence: Integrate a short, precise quotation syntactically into your own sentence.
3. Analysis: Unpack specific word choices (diction/imagery) inside the quote—never leave a quote unexplained.`,
          takeaways: [
            "Never drop a standalone quotation into a paragraph without framing it and analyzing its specific words.",
            "Read your draft aloud during the final pass to catch awkward rhythm and missing punctuation.",
            "Switch to the Practice Quiz tab to verify your English mastery.",
          ],
        },
      ],
    },
    quiz: [
      {
        question: "Which of the following sentences fixes the comma splice in: `The novel received harsh reviews upon release, however, it is now considered a classic.`?",
        options: [
          "`The novel received harsh reviews upon release, it is now considered a classic.`",
          "`The novel received harsh reviews upon release; however, it is now considered a classic.`",
          "`The novel received harsh reviews upon release however it is now considered a classic.`",
          "`The novel, received harsh reviews upon release, however it is now considered a classic.`",
        ],
        correctIndex: 1,
        explanation:
          "`however` is a conjunctive adverb, not a coordinating conjunction; joining two independent clauses with `however` requires a semicolon before it and a comma after it (`; however,`).",
        difficulty: "foundation",
      },
      {
        question: "Which revision corrects the dangling modifier in: `Walking through the ancient library, the illuminated manuscripts caught her attention.`?",
        options: [
          "`Walking through the ancient library, she noticed the illuminated manuscripts.`",
          "`Walking through the ancient library, attention was caught by the illuminated manuscripts.`",
          "`The illuminated manuscripts, walking through the ancient library, caught her attention.`",
          "`Having walked through the ancient library, the manuscripts were illuminated.`",
        ],
        correctIndex: 0,
        explanation:
          "The introductory participial phrase `Walking through the ancient library` must be immediately followed by the grammatical subject performing the walking (`she`), not `the illuminated manuscripts`.",
        difficulty: "applied",
      },
      {
        question: "Which sentence demonstrates correct subject-verb agreement and parallel structure?",
        options: [
          "`The series of lectures on modern poetry were both insightful and inspired the students.`",
          "`The series of lectures on modern poetry was not only insightful, but also inspiring.`",
          "`The series of lectures on modern poetry were not only insightful, but also inspired.`",
          "`The series of lectures on modern poetry was both insightful and it inspired students.`",
        ],
        correctIndex: 1,
        explanation:
          "The singular head noun `series` takes the singular verb `was` (ignoring `of lectures`), and `not only [adjective: insightful] but also [adjective: inspiring]` maintains strict parallel form.",
        difficulty: "applied",
      },
      {
        question: "According to the 'Old-to-New' (Known-New) principle of paragraph cohesion, how should consecutive sentences in a paragraph be ordered?",
        options: [
          "Introduce a completely unrelated subject at the start of every sentence",
          "Begin each sentence with familiar context echoed from the previous sentence, and place the most important new information at the end of the sentence",
          "Write every sentence in the passive voice",
          "Avoid using pronouns or transitional phrases between sentences",
        ],
        correctIndex: 1,
        explanation:
          "Anchoring the start of a sentence in familiar context from the prior sentence while placing new high-impact claims at the end creates smooth logical flow.",
        difficulty: "challenge",
      },
    ],
  },
];

const CS_TECH_TOPIC_KEYWORDS = [
  "computer science",
  "machine learning",
  "full-stack",
  "cybersecurity",
  "distributed",
  "programming",
  "software",
  "data structures",
  "algorithm",
  "database",
  "sql",
  "network",
  "operating system",
  "compiler",
  "artificial intelligence",
  "web dev",
  "react",
  "typescript",
  "javascript",
  "python",
  "golang",
  "rust",
  "linear algebra",
  "discrete math",
];

export function findTopicBlueprint(nodeName: string, topic?: string): TopicBlueprint | null {
  const codeMatch = nodeName.match(/^([A-Z]+\d+)/);
  const code = codeMatch?.[1]?.toUpperCase() ?? "";

  if (code) {
    const byCode = TOPIC_BLUEPRINTS.find((b) => b.codeMatch?.includes(code));
    if (byCode) return byCode;
  }

  const lowerTopic = (topic ?? "").toLowerCase();
  const lowerNode = nodeName.toLowerCase();
  const hay = `${lowerNode} ${lowerTopic}`;

  // If the overall curriculum topic is clearly English / language / writing, match the English blueprint first
  if (
    ["english", "grammar", "writing", "literature", "rhetoric", "essay", "vocabulary", "language"].some(
      (kw) => hay.includes(kw),
    )
  ) {
    return TOPIC_BLUEPRINTS.find((b) => b.codeMatch?.includes("ENG101")) ?? null;
  }

  // Only match Computer Science blueprints when the topic or course is genuinely CS/Math/Tech
  const isTechContext =
    !lowerTopic ||
    CS_TECH_TOPIC_KEYWORDS.some((kw) => lowerTopic.includes(kw) || lowerNode.includes(kw));
  if (!isTechContext) {
    return null;
  }

  let best: TopicBlueprint | null = null;
  let bestScore = 0;

  for (const bp of TOPIC_BLUEPRINTS) {
    let score = 0;
    for (const kw of bp.keywords) {
      if (hay.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = bp;
    }
  }

  return best;
}
