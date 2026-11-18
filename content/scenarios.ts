/**
 * Quiz content for "Naughty or Nice: The Fabric Best Practices Predictor".
 *
 * This is the single source of truth for scenarios. Edit here, then run
 * `npm run content:publish` to load it. Rows are matched on `slug`.
 *
 * Rules:
 * - Never reuse a slug for a different scenario, and never change a shipped
 *   scenario's slug. Edit the other fields freely.
 * - Every explanation must rest on a real, documented Microsoft Fabric / Power BI
 *   practice. The `source` comment on each entry names the Microsoft Learn topic
 *   it is based on. The jokes are decoration; the facts are load-bearing.
 * - true_false: options is null and correctAnswer is "naughty" or "nice".
 * - multiple_choice: options is a string array and correctAnswer must equal one
 *   of the options exactly.
 *
 * No Rayfin imports here on purpose: this file stays plain data.
 */

export interface ScenarioContent {
  slug: string;
  prompt: string;
  questionType: 'multiple_choice' | 'true_false';
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
  naughtyOrNice: 'naughty' | 'nice';
  category:
    | 'Capacity & Cost'
    | 'Security & Governance'
    | 'CI/CD'
    | 'Modeling'
    | 'Performance'
    | 'Workspace Hygiene';
  pointValue: number;
}

export const scenarios: ScenarioContent[] = [
  // ── CI/CD ────────────────────────────────────────────────────────────────
  {
    // source: Microsoft Learn — "Introduction to deployment pipelines"
    slug: 'holidayeve-prod-push',
    prompt:
      "It's 4:55 PM on Christmas Eve. Rudolph's team drags a brand-new " +
      'semantic model straight into the Production workspace, no deployment pipeline, ' +
      'no testing, not even gift-wrapped. Then they leave for the holiday, carrying a carton of eggnog, with their phones on silent. ' +
      'Naughty or Nice?',
    questionType: 'true_false',
    options: null,
    correctAnswer: 'naughty',
    explanation:
      "Coal. A whole sleigh of it. Rudolph's nose isn't the only thing glowing red: " +
      "so is the on-call elf's text messages. Fabric deployment pipelines exist so content " +
      'moves through Development, Test and Production stages, where you can compare ' +
      'stages before deploying and use deployment rules to swap data sources per ' +
      'stage. Hand-editing Production before a holiday is not a release ' +
      'strategy. It is a holiday tradition nobody asked for.',
    naughtyOrNice: 'naughty',
    category: 'CI/CD',
    pointValue: 10,
  },
  {
    // source: Microsoft Learn — "What is Microsoft Fabric Git integration?" and
    // "Choose the best Fabric CI/CD workflow option for you"
    slug: 'git-feature-branches',
    prompt:
      'The Toy Analytics elves connect their Dev workspace to an Azure DevOps repo with ' +
      'Fabric Git integration. Each elf works in a feature branch, opens a pull request, ' +
      'and nobody force-pushes to main "just this once because it\'s Christmas." Naughty or Nice?',
    questionType: 'true_false',
    options: null,
    correctAnswer: 'nice',
    explanation:
      'Nice! The foreman had to sit down. Fabric Git integration connects a workspace ' +
      'to Azure DevOps or GitHub, so item definitions get version history, branches ' +
      "and pull-request review. Microsoft's CI/CD guidance recommends isolated feature " +
      'branches (or workspaces) per developer, merged back through PRs. When something ' +
      'breaks, you can see exactly who did it. In the workshop we call that ' +
      '"accountability." The elves call it "the naughty list."',
    naughtyOrNice: 'nice',
    category: 'CI/CD',
    pointValue: 10,
  },

  // ── Capacity & Cost ──────────────────────────────────────────────────────
  {
    // source: Microsoft Learn — "Pause and resume your capacity"
    slug: 'pause-dev-capacity',
    prompt:
      "The Workshop's dev/test F SKU runs 24/7, mostly computing nothing while the " +
      'elves sleep. The Head Elf schedules it to pause after hours and on weekends, ' +
      'then resume each morning before the first cocoa. Naughty or Nice?',
    questionType: 'true_false',
    options: null,
    correctAnswer: 'nice',
    explanation:
      'Nice, and Mrs. Claus from Accounts Payable sends her regards. F SKU capacities ' +
      'bought through Azure can be paused, and compute billing stops while they are ' +
      'paused. One footnote from the bean counters: pausing settles any smoothed or ' +
      'carried-forward usage straight away, so pause after the overnight jobs finish, ' +
      'not halfway through. Lights off when you leave the workshop. Were you raised ' +
      'in a barn? (The reindeer were. They have an excuse. That\'s why they are only viewers.)',
    naughtyOrNice: 'nice',
    category: 'Capacity & Cost',
    pointValue: 10,
  },
  {
    // source: Microsoft Learn — "What is the Microsoft Fabric Capacity Metrics app?"
    // and "Understand your Fabric capacity throttling"
    slug: 'throttling-first-move',
    prompt:
      'Reports in the Gift Logistics workspace are slower than a reindeer on ' +
      'the Day after Christmas, and users keep hitting throttling errors. What should the elf ' +
      'on capacity duty do first?',
    questionType: 'multiple_choice',
    options: [
      "Immediately scale up to the biggest SKU available and expense it to Santa's personal card",
      'Open the Fabric Capacity Metrics app to see which items and operations are burning capacity units',
      'Turn off smoothing so background jobs stop counting against the capacity',
      'Delete every semantic model older than last Christmas and hope nobody notices',
    ],
    correctAnswer:
      'Open the Fabric Capacity Metrics app to see which items and operations are burning capacity units',
    explanation:
      "Diagnose before you spend Santa's money. The man still drives a sleigh from " +
      'the 1800s. The Capacity Metrics app shows utilization, throttling and the ' +
      'items and operations driving consumption. Smoothing is how Fabric spreads ' +
      'usage over time (background jobs over 24 hours), and it is not a switch you ' +
      "can turn off, no matter how hard you glare at it. Scaling up may help later, " +
      'once you know which reindeer\'s notebook is quietly eating the all the hay.',
    naughtyOrNice: 'nice',
    category: 'Capacity & Cost',
    pointValue: 10,
  },

  // ── Security & Governance ────────────────────────────────────────────────
  {
    // source: Microsoft Learn — "Row-level security (RLS) with Power BI"
    // ("RLS only applies to users with Viewer permissions in a workspace")
    slug: 'rls-vs-admin-shortcut',
    prompt:
      'Regional toy managers should only see their own region. Jingle carefully builds ' +
      'RLS roles on the semantic model, then adds every manager to the workspace as a ' +
      'Contributor "so they can find things." Jingle is very proud. Will RLS restrict ' +
      'what they see?',
    questionType: 'multiple_choice',
    options: [
      'Yes, RLS applies to everyone who opens the report. Jingle deserves an extra cookie.',
      'No, RLS does not restrict workspace Admins, Members or Contributors; consumers should get Viewer access or an app instead',
      'Only if the report is opened in the mobile app, while the sleigh is in flight',
      'Yes, but only after the semantic model is refreshed three times while someone hums "Jingle Bells"',
    ],
    correctAnswer:
      'No, RLS does not restrict workspace Admins, Members or Contributors; consumers should get Viewer access or an app instead',
    explanation:
      'Jingle built a beautiful lock and then handed out master keys at the door. ' +
      'RLS only filters data for users with Viewer permissions. Admins, Members and ' +
      'Contributors see everything, including the South Pole numbers they really ' +
      'should not see. Share with report consumers through the Viewer role, an app or ' +
      'item sharing, and keep edit roles for the people who actually build things. ' +
      'Jingle does not get the cookie.',
    naughtyOrNice: 'naughty',
    category: 'Security & Governance',
    pointValue: 10,
  },
  {
    // source: Microsoft Learn — "Information protection in Microsoft Fabric" /
    // "Sensitivity labels in Fabric and Power BI"
    slug: 'sensitivity-labels-pii',
    prompt:
      'The Nice List holds the name and home address of every child on Earth, which is, ' +
      'legally speaking, a lot. The compliance elves apply a Microsoft Purview ' +
      'sensitivity label to the lakehouse and every report built on it. Naughty or Nice?',
    questionType: 'true_false',
    options: null,
    correctAnswer: 'nice',
    explanation:
      'Nice. Purview Information Protection sensitivity labels mark Fabric items so ' +
      'everyone can see how sensitive they are, and the label travels with the data ' +
      'when it is exported to supported formats such as Excel, PowerPoint and PDF. ' +
      'Santa knows when you are sleeping and knows when you are awake. The least he ' +
      'can do is add a sensitivity label to the spreadsheet.',
    naughtyOrNice: 'nice',
    category: 'Security & Governance',
    pointValue: 10,
  },

  // ── Modeling ─────────────────────────────────────────────────────────────
  {
    // source: Microsoft Learn — "Understand star schema and the importance for Power BI"
    slug: 'star-schema-gift-model',
    prompt:
      'The elves are modeling gift deliveries for Power BI and have opinions. Loud ' +
      'ones. Which model shape will the Workshop foreman actually sign off on?',
    questionType: 'multiple_choice',
    options: [
      'One giant flat table with 900 columns, because "what if we need it someday"',
      'A star schema: a Deliveries fact table surrounded by Child, Toy, Region and Date dimension tables',
      'Many tables joined by bi-directional many-to-many relationships everywhere, like tangled tinsel',
      'A separate table for each day of December, plus one called "Dec_25_FINAL_v2"',
    ],
    correctAnswer:
      'A star schema: a Deliveries fact table surrounded by Child, Toy, Region and Date dimension tables',
    explanation:
      "Use a star schema, like the star on the Christmas tree. Microsoft's " +
      'guidance is direct: Power BI models work best as star schemas, with facts ' +
      'holding the events and measures and dimensions holding the things you filter ' +
      'and group by. You get simpler DAX, better performance and a model your ' +
      'successor can understand without needing a therapist or a stiff eggnog.',
    naughtyOrNice: 'nice',
    category: 'Modeling',
    pointValue: 10,
  },
  {
    // source: Microsoft Learn — "Bi-directional relationship guidance"
    slug: 'bidirectional-everywhere',
    prompt:
      'Tinsel sets every single relationship in the Toy Inventory model to cross-filter ' +
      'in both directions "just to be safe." The model diagram now looks like a ' +
      'string of lights that has been in a box since 1987. Naughty or Nice?',
    questionType: 'true_false',
    options: null,
    correctAnswer: 'naughty',
    explanation:
      'Naughty. "Just to be safe" is how ambiguous filter paths get built. Microsoft\'s ' +
      'guidance says to use bi-directional relationships sparingly: they can hurt ' +
      'query performance and give confusing results. Keep single-direction filters ' +
      'from dimensions to facts, and turn on both directions only for a specific ' +
      'need, or with CROSSFILTER inside one measure. Untangle it, Tinsel. We all ' +
      'have to untangle the lights eventually.',
    naughtyOrNice: 'naughty',
    category: 'Modeling',
    pointValue: 10,
  },

  // ── Performance ──────────────────────────────────────────────────────────
  {
    // source: Microsoft Learn — "Delta Lake table optimization and V-Order" and
    // "Direct Lake overview"
    slug: 'vorder-direct-lake',
    prompt:
      'The Delta tables behind the Sleigh Route Direct Lake semantic model are written ' +
      'with V-Order enabled, so Christmas Eve dashboards load before the reindeer ' +
      'finish stretching. Naughty or Nice?',
    questionType: 'true_false',
    options: null,
    correctAnswer: 'nice',
    explanation:
      'Nice. V-Order is a write-time optimization for Parquet files that speeds up ' +
      'reads by Fabric engines, and Direct Lake semantic models benefit the most. ' +
      'Writes cost a little more, which is worth it for tables that reports hammer ' +
      'all day. The V is for Very fast. (It is not. But it should be.) Check your ' +
      'Spark settings, because newer workspaces may not enable it by default.',
    naughtyOrNice: 'nice',
    category: 'Performance',
    pointValue: 10,
  },
  {
    // source: Microsoft Learn — "Delta Lake table optimization and V-Order" and
    // "Use table maintenance feature to manage delta tables in Fabric"
    slug: 'tiny-files-never-optimize',
    prompt:
      'A streaming job appends a few rows to the Letters to Santa Delta table every few ' +
      'seconds. The table now holds hundreds of thousands of tiny files, like confetti ' +
      'after a very sad party. Nobody has ever run OPTIMIZE. Naughty or Nice?',
    questionType: 'true_false',
    options: null,
    correctAnswer: 'naughty',
    explanation:
      'Naughty. That is the small-file problem, and every reader pays for it, one ' +
      'tiny file at a time. Compact the files with OPTIMIZE, or with Lakehouse table ' +
      'maintenance (which also applies V-Order and runs VACUUM to clear old files), ' +
      'and schedule it for tables that get frequent small writes. Santa reads every ' +
      'letter. Your queries should not have to open every envelope separately.',
    naughtyOrNice: 'naughty',
    category: 'Performance',
    pointValue: 10,
  },

  // ── Workspace Hygiene ────────────────────────────────────────────────────
  {
    // source: Microsoft Learn — "Fabric domains"
    slug: 'domains-by-department',
    prompt:
      'The North Pole organizes its Fabric workspaces into domains (Toy Manufacturing, ' +
      'Reindeer Operations and Gift Logistics), each with its own domain admins, and ' +
      'nobody has to ask "which workspace was that again?" Naughty or Nice?',
    questionType: 'true_false',
    options: null,
    correctAnswer: 'nice',
    explanation:
      'Nice. Domains group workspaces by business area so each area can govern its ' +
      'own data, the data-mesh pattern Fabric is built to support. Domain admins can ' +
      'apply settings for their area, and people can filter the OneLake catalog by ' +
      "domain to find what they need. Reindeer Ops doesn't touch Toy Manufacturing's " +
      'data. Toy Manufacturing does not touch the reindeer. Everyone is happier. ' +
      'Especially the reindeer.',
    naughtyOrNice: 'nice',
    category: 'Workspace Hygiene',
    pointValue: 10,
  },
  {
    // source: Microsoft Learn — "Endorsement overview" / "Endorse Fabric and
    // Power BI items"
    slug: 'who-can-certify',
    prompt:
      'Pepper wants the official Toy Demand semantic model to wear the shiny Certified ' +
      'badge in the OneLake catalog. Pepper is holding a gold star sticker and looking ' +
      'hopeful. Who is allowed to certify it?',
    questionType: 'multiple_choice',
    options: [
      'Anyone with Viewer access to the item',
      'Anyone with write permission on the item, no questions asked',
      'Only reviewers the Fabric administrator has authorized in tenant settings',
      'Santa, by checking it twice',
    ],
    correctAnswer: 'Only reviewers the Fabric administrator has authorized in tenant settings',
    explanation:
      'Put the sticker down, Pepper. Certification is not a participation trophy. ' +
      'Anyone with write permission can mark an item Promoted, but Certified is ' +
      'reserved for reviewers the Fabric administrator authorizes in tenant settings. ' +
      'That is what makes the badge mean something. Santa does check it twice, but ' +
      'that is a separate process your model needs to follow.',
    naughtyOrNice: 'nice',
    category: 'Workspace Hygiene',
    pointValue: 10,
  },
  {
    // source: Microsoft Learn — Power BI implementation planning: "Workspace-level
    // workspace planning" (workspace naming conventions)
    slug: 'workspace-name-chaos',
    prompt:
      'The workspace list reads: "Test", "test2", "Sparkle Stuff", "Sparkle Stuff ' +
      'FINAL", "Sparkle Stuff FINAL (2)" and "DO NOT USE (use this one)". No naming ' +
      'convention. No descriptions. Just vibes. Naughty or Nice?',
    questionType: 'true_false',
    options: null,
    correctAnswer: 'naughty',
    explanation:
      "Naughty, and the foreman needs a moment. Microsoft's workspace planning " +
      'guidance recommends a consistent naming convention, such as team or subject ' +
      'area plus a stage suffix like [Dev], [Test] or [Prod], along with a workspace ' +
      'description. Then people can find the right workspace without a scavenger ' +
      'hunt. Sparkle, there are four FINALs. Only one of them can be final. That is ' +
      'what the word means.',
    naughtyOrNice: 'naughty',
    category: 'Workspace Hygiene',
    pointValue: 10,
  },
];
