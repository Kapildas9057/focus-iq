export interface PyqQuestion {
  id?: number;
  subject: string;
  chapter: string;   // Chapter/topic tag — used for post-session quiz filtering
  exam: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// ─── Per-grade, per-chapter question bank ─────────────────────────────────────
// All questions are tagged to their exact chapter so topic-filtered quizzes work.
// If a chapter has no questions, the UI shows "still building this topic."
export const GRADE_QUESTIONS: Record<string, PyqQuestion[]> = {
  'Class 8': [
    { subject: 'Science', chapter: 'Cell', exam: 'Boards', difficulty: 'Easy', question: 'What acts as the control center of a cell?', options: ['A) Mitochondria', 'B) Nucleus', 'C) Ribosome', 'D) Cytoplasm'], correctIndex: 1, explanation: 'The nucleus contains genetic material and controls cell activities.' },
    { subject: 'Science', chapter: 'Cell', exam: 'Boards', difficulty: 'Medium', question: 'Which organelle is called the "powerhouse of the cell"?', options: ['A) Nucleus', 'B) Ribosome', 'C) Golgi body', 'D) Mitochondria'], correctIndex: 3, explanation: 'Mitochondria generate most of the chemical energy needed to power the cell.' },
    { subject: 'Science', chapter: 'Cell', exam: 'Boards', difficulty: 'Hard', question: 'Which of these is NOT a function of the cell membrane?', options: ['A) Controls what enters the cell', 'B) Produces ATP', 'C) Maintains cell shape', 'D) Allows communication between cells'], correctIndex: 1, explanation: 'ATP production occurs in mitochondria, not the cell membrane.' },
    { subject: 'Science', chapter: 'Force', exam: 'Boards', difficulty: 'Easy', question: 'What is the SI unit of force?', options: ['A) Joule', 'B) Newton', 'C) Pascal', 'D) Watt'], correctIndex: 1, explanation: 'Force is measured in Newtons (N) in the SI system.' },
    { subject: 'Science', chapter: 'Force', exam: 'Boards', difficulty: 'Medium', question: 'Which force acts between two charged particles?', options: ['A) Gravitational', 'B) Frictional', 'C) Electrostatic', 'D) Magnetic'], correctIndex: 2, explanation: 'Electrostatic (Coulomb) force acts between charged particles.' },
    { subject: 'Science', chapter: 'Friction', exam: 'Boards', difficulty: 'Easy', question: 'Friction always acts in the direction _____ to motion.', options: ['A) Same', 'B) Perpendicular', 'C) Opposite', 'D) Diagonal'], correctIndex: 2, explanation: 'Friction opposes relative motion between surfaces.' },
    { subject: 'Science', chapter: 'Sound', exam: 'Boards', difficulty: 'Easy', question: 'Sound travels fastest through which medium?', options: ['A) Air', 'B) Water', 'C) Vacuum', 'D) Steel'], correctIndex: 3, explanation: 'Sound travels fastest through solids like steel because particles are tightly packed.' },
    { subject: 'Science', chapter: 'Sound', exam: 'Boards', difficulty: 'Medium', question: 'The frequency of a sound wave is 256 Hz. How many vibrations per second?', options: ['A) 25.6', 'B) 2560', 'C) 256', 'D) 0.256'], correctIndex: 2, explanation: 'Frequency is the number of vibrations per second; 256 Hz = 256 vibrations/s.' },
    { subject: 'Mathematics', chapter: 'Rational Numbers', exam: 'Boards', difficulty: 'Easy', question: 'What is the cube root of sixty-four?', options: ['A) 8', 'B) 4', 'C) 16', 'D) 2'], correctIndex: 1, explanation: '4 × 4 × 4 = 64' },
    { subject: 'Mathematics', chapter: 'Mensuration', exam: 'Boards', difficulty: 'Medium', question: 'Area of a circle with radius 7 cm is?', options: ['A) 22 cm²', 'B) 154 cm²', 'C) 44 cm²', 'D) 49 cm²'], correctIndex: 1, explanation: 'A = πr² = 22/7 × 7² = 22 × 7 = 154 cm².' },
    { subject: 'Mathematics', chapter: 'Squares', exam: 'Boards', difficulty: 'Easy', question: 'How many faces does a tetrahedron have?', options: ['A) 4', 'B) 6', 'C) 8', 'D) 12'], correctIndex: 0, explanation: 'A tetrahedron has 4 triangular faces.' },
  ],

  'Class 9': [
    { subject: 'Science', chapter: 'Motion', exam: 'Boards', difficulty: 'Easy', question: 'What is the rate of change of velocity called?', options: ['A) Speed', 'B) Displacement', 'C) Acceleration', 'D) Momentum'], correctIndex: 2, explanation: 'Acceleration is defined as the rate of change of velocity with respect to time.' },
    { subject: 'Science', chapter: 'Motion', exam: 'Boards', difficulty: 'Medium', question: 'A car accelerates from 20 m/s to 60 m/s in 8 s. What is its acceleration?', options: ['A) 2 m/s²', 'B) 5 m/s²', 'C) 10 m/s²', 'D) 40 m/s²'], correctIndex: 1, explanation: 'a = (v-u)/t = (60-20)/8 = 40/8 = 5 m/s²' },
    { subject: 'Science', chapter: 'Motion', exam: 'Boards', difficulty: 'Hard', question: 'A body travels 100 m in 10 s and next 100 m in 5 s. What is average speed?', options: ['A) 10 m/s', 'B) 13.3 m/s', 'C) 15 m/s', 'D) 20 m/s'], correctIndex: 1, explanation: 'Total distance = 200 m, total time = 15 s. Average speed = 200/15 = 13.3 m/s.' },
    { subject: 'Science', chapter: 'Gravitation', exam: 'Boards', difficulty: 'Easy', question: 'The value of g on Earth is approximately?', options: ['A) 8.9 m/s²', 'B) 9.8 m/s²', 'C) 10.8 m/s²', 'D) 11 m/s²'], correctIndex: 1, explanation: 'Standard acceleration due to gravity on Earth is 9.8 m/s².' },
    { subject: 'Science', chapter: 'Gravitation', exam: 'Boards', difficulty: 'Medium', question: 'What is the weight of a 10 kg object on the Moon? (g_moon = 1.6 m/s²)', options: ['A) 10 N', 'B) 16 N', 'C) 98 N', 'D) 100 N'], correctIndex: 1, explanation: 'W = mg = 10 × 1.6 = 16 N.' },
    { subject: 'Science', chapter: 'Tissues', exam: 'Boards', difficulty: 'Easy', question: 'Which plant tissue transports water?', options: ['A) Phloem', 'B) Xylem', 'C) Parenchyma', 'D) Collenchyma'], correctIndex: 1, explanation: 'Xylem transports water and minerals from roots to leaves.' },
    { subject: 'Science', chapter: 'Atoms and Molecules', exam: 'Boards', difficulty: 'Medium', question: 'What is the fourth state of matter?', options: ['A) Solid', 'B) Liquid', 'C) Gas', 'D) Plasma'], correctIndex: 3, explanation: 'Plasma is an ionized state of matter, making up the fourth state.' },
    { subject: 'Mathematics', chapter: 'Polynomials', exam: 'Boards', difficulty: 'Easy', question: 'What is the degree of a non-zero constant polynomial?', options: ['A) 0', 'B) 1', 'C) Undefined', 'D) 2'], correctIndex: 0, explanation: 'A constant polynomial (like 5) can be written as 5x^0, so its degree is 0.' },
    { subject: 'Mathematics', chapter: 'Triangles', exam: 'Boards', difficulty: 'Medium', question: 'In a right triangle, hypotenuse = 13 cm, one leg = 5 cm. Other leg = ?', options: ['A) 8 cm', 'B) 10 cm', 'C) 12 cm', 'D) 11 cm'], correctIndex: 2, explanation: '13² - 5² = 169 - 25 = 144. √144 = 12 cm.' },
    { subject: 'Mathematics', chapter: 'Statistics', exam: 'Boards', difficulty: 'Easy', question: 'Mean of 2, 4, 6, 8, 10 is?', options: ['A) 4', 'B) 5', 'C) 6', 'D) 8'], correctIndex: 2, explanation: 'Mean = (2+4+6+8+10)/5 = 30/5 = 6.' },
  ],

  'Class 10': [
    { subject: 'Science', chapter: 'Electricity', exam: 'Boards', difficulty: 'Easy', question: 'What is the SI unit of electric current?', options: ['A) Volt', 'B) Ohm', 'C) Ampere', 'D) Watt'], correctIndex: 2, explanation: 'Electric current is measured in Amperes (A).' },
    { subject: 'Science', chapter: 'Electricity', exam: 'Boards', difficulty: 'Medium', question: 'A 6 Ω and 3 Ω resistor are in parallel. What is the net resistance?', options: ['A) 9 Ω', 'B) 2 Ω', 'C) 18 Ω', 'D) 0.5 Ω'], correctIndex: 1, explanation: '(6×3)/(6+3) = 18/9 = 2 Ω' },
    { subject: 'Science', chapter: 'Electricity', exam: 'Boards', difficulty: 'Hard', question: 'Power dissipated in a 10 Ω resistor carrying 2 A current is?', options: ['A) 20 W', 'B) 40 W', 'C) 5 W', 'D) 100 W'], correctIndex: 1, explanation: 'P = I²R = 2² × 10 = 4 × 10 = 40 W.' },
    { subject: 'Science', chapter: 'Electricity', exam: 'Boards', difficulty: 'Extreme', question: 'Three 6 Ω resistors in parallel, connected in series with a 4 Ω resistor. Total resistance?', options: ['A) 6 Ω', 'B) 10 Ω', 'C) 2 Ω', 'D) 5 Ω'], correctIndex: 0, explanation: 'Parallel combination = 6/3 = 2 Ω. Series: 2 + 4 = 6 Ω.' },
    { subject: 'Science', chapter: 'Chemical Reactions', exam: 'Boards', difficulty: 'Easy', question: 'Which gas is produced when acid reacts with a metal?', options: ['A) Oxygen', 'B) Nitrogen', 'C) Carbon Dioxide', 'D) Hydrogen'], correctIndex: 3, explanation: 'Metals displace hydrogen from acids, releasing hydrogen gas.' },
    { subject: 'Science', chapter: 'Chemical Reactions', exam: 'Boards', difficulty: 'Medium', question: 'Fe₂O₃ + CO → Fe + CO₂ is an example of which type of reaction?', options: ['A) Combination', 'B) Decomposition', 'C) Displacement', 'D) Redox'], correctIndex: 3, explanation: 'This is a redox (reduction-oxidation) reaction where Fe is reduced and C is oxidized.' },
    { subject: 'Science', chapter: 'Acids Bases Salts', exam: 'Boards', difficulty: 'Medium', question: 'What is the pH of a neutral solution at 25 °C?', options: ['A) 0', 'B) 7', 'C) 14', 'D) 1'], correctIndex: 1, explanation: 'At standard temperature (25°C), a neutral solution has a pH of exactly 7.' },
    { subject: 'Science', chapter: 'Acids Bases Salts', exam: 'Boards', difficulty: 'Hard', question: 'Which salt is formed by mixing HCl and NaOH?', options: ['A) Na₂CO₃', 'B) NaCl', 'C) NaHCO₃', 'D) NaOH'], correctIndex: 1, explanation: 'HCl + NaOH → NaCl + H₂O. NaCl is a neutral salt.' },
    { subject: 'Science', chapter: 'Light', exam: 'Boards', difficulty: 'Easy', question: 'A concave mirror has a focal length of 15 cm. Its radius of curvature is?', options: ['A) 7.5 cm', 'B) 15 cm', 'C) 30 cm', 'D) 45 cm'], correctIndex: 2, explanation: 'Radius of curvature = 2 × focal length = 2 × 15 = 30 cm.' },
    { subject: 'Science', chapter: 'Life Processes', exam: 'Boards', difficulty: 'Easy', question: 'Which pigment is responsible for photosynthesis?', options: ['A) Hemoglobin', 'B) Chlorophyll', 'C) Melanin', 'D) Carotene'], correctIndex: 1, explanation: 'Chlorophyll in chloroplasts absorbs sunlight for photosynthesis.' },
    { subject: 'Science', chapter: 'Heredity and Evolution', exam: 'Boards', difficulty: 'Medium', question: 'Which scientist proposed the theory of natural selection?', options: ['A) Mendel', 'B) Lamarck', 'C) Darwin', 'D) Watson'], correctIndex: 2, explanation: 'Charles Darwin proposed natural selection as the mechanism of evolution.' },
    { subject: 'Mathematics', chapter: 'Quadratic Equations', exam: 'Boards', difficulty: 'Hard', question: 'If α and β are roots of 2x² – 5x + 3 = 0, find α + β.', options: ['A) 5/2', 'B) -5/2', 'C) 3/2', 'D) -3/2'], correctIndex: 0, explanation: 'Sum of roots = -b/a = -(-5)/2 = 5/2' },
    { subject: 'Mathematics', chapter: 'Trigonometry', exam: 'Boards', difficulty: 'Easy', question: 'Value of sin 30° is?', options: ['A) 1', 'B) √3/2', 'C) 1/2', 'D) 0'], correctIndex: 2, explanation: 'sin 30° = 1/2.' },
    { subject: 'Mathematics', chapter: 'Trigonometry', exam: 'Boards', difficulty: 'Medium', question: 'If sin θ = 3/5, what is cos θ?', options: ['A) 4/5', 'B) 3/4', 'C) 5/3', 'D) 5/4'], correctIndex: 0, explanation: 'cos θ = √(1-sin²θ) = √(1 - 9/25) = √(16/25) = 4/5.' },
    { subject: 'Mathematics', chapter: 'Statistics', exam: 'Boards', difficulty: 'Easy', question: 'Median of 3, 5, 7, 9, 11 is?', options: ['A) 7', 'B) 5', 'C) 9', 'D) 6'], correctIndex: 0, explanation: 'Ordered set: 3,5,7,9,11. Median (middle value) = 7.' },
    { subject: 'Mathematics', chapter: 'Circles', exam: 'Boards', difficulty: 'Medium', question: 'Tangents drawn from an external point to a circle are?', options: ['A) Unequal', 'B) Equal', 'C) Perpendicular to each other', 'D) Parallel'], correctIndex: 1, explanation: 'Tangents from an external point to a circle are always equal in length.' },
  ],

  'Class 11': [
    { subject: 'Physics', chapter: 'Units and Measurements', exam: 'Boards', difficulty: 'Easy', question: 'What is the dimension of velocity?', options: ['A) [LT⁻²]', 'B) [L²T⁻¹]', 'C) [LT⁻¹]', 'D) [MLT⁻¹]'], correctIndex: 2, explanation: 'Velocity is distance/time, so its dimension is [LT⁻¹].' },
    { subject: 'Physics', chapter: 'Motion in a Straight Line', exam: 'Boards', difficulty: 'Medium', question: 'A body is thrown vertically up with 20 m/s. Time to reach max height? (g = 10 m/s²)', options: ['A) 1 s', 'B) 2 s', 'C) 4 s', 'D) 0.5 s'], correctIndex: 1, explanation: 'v = u - gt → 0 = 20 - 10t → t = 2 s.' },
    { subject: 'Physics', chapter: 'Laws of Motion', exam: 'Boards', difficulty: 'Easy', question: 'Which of Newton\'s laws defines inertia?', options: ['A) First', 'B) Second', 'C) Third', 'D) Fourth'], correctIndex: 0, explanation: 'Newton\'s First Law (law of inertia) states a body remains at rest or in uniform motion unless acted upon by a force.' },
    { subject: 'Physics', chapter: 'Laws of Motion', exam: 'Boards', difficulty: 'Medium', question: 'A 5 kg object is pushed with 20 N force. Acceleration = ?', options: ['A) 1 m/s²', 'B) 4 m/s²', 'C) 100 m/s²', 'D) 0.25 m/s²'], correctIndex: 1, explanation: 'F = ma → a = F/m = 20/5 = 4 m/s².' },
    { subject: 'Physics', chapter: 'Work, Energy and Power', exam: 'Boards', difficulty: 'Easy', question: 'Unit of work in SI system is?', options: ['A) Watt', 'B) Joule', 'C) Newton', 'D) Pascal'], correctIndex: 1, explanation: 'Work is measured in Joules (N·m) in the SI system.' },
    { subject: 'Chemistry', chapter: 'Structure of Atom', exam: 'Boards', difficulty: 'Easy', question: 'How many electrons does a neutral carbon atom have?', options: ['A) 4', 'B) 6', 'C) 8', 'D) 12'], correctIndex: 1, explanation: 'Carbon (atomic number 6) has 6 protons and 6 electrons in its neutral state.' },
    { subject: 'Chemistry', chapter: 'Structure of Atom', exam: 'Boards', difficulty: 'Medium', question: 'Max electrons in the third shell (n=3) is?', options: ['A) 8', 'B) 18', 'C) 32', 'D) 2'], correctIndex: 1, explanation: 'Max electrons in shell n = 2n². For n=3: 2×9 = 18.' },
    { subject: 'Chemistry', chapter: 'Chemical Bonding and Molecular Structure', exam: 'Boards', difficulty: 'Medium', question: 'The shape of water (H₂O) molecule is?', options: ['A) Linear', 'B) Tetrahedral', 'C) Bent/Angular', 'D) Trigonal planar'], correctIndex: 2, explanation: 'H₂O has 2 bond pairs and 2 lone pairs, giving a bent/angular shape.' },
    { subject: 'Chemistry', chapter: 'Thermodynamics', exam: 'Boards', difficulty: 'Hard', question: 'At constant pressure, which of the following is the correct expression for heat?', options: ['A) q = ΔU', 'B) q = ΔH', 'C) q = ΔG', 'D) q = ΔS'], correctIndex: 1, explanation: 'At constant pressure, heat transferred q_p = ΔH (change in enthalpy).' },
    { subject: 'Mathematics', chapter: 'Trigonometric Functions', exam: 'Boards', difficulty: 'Easy', question: 'sin² θ + cos² θ = ?', options: ['A) 0', 'B) -1', 'C) 1', 'D) 2'], correctIndex: 2, explanation: 'This is the fundamental Pythagorean trigonometric identity.' },
    { subject: 'Mathematics', chapter: 'Permutations and Combinations', exam: 'Boards', difficulty: 'Medium', question: 'Number of ways to arrange the letters of INDIA is?', options: ['A) 120', 'B) 60', 'C) 30', 'D) 24'], correctIndex: 1, explanation: 'INDIA has 5 letters with I repeating twice: 5!/2! = 120/2 = 60.' },
    { subject: 'Mathematics', chapter: 'Permutations and Combinations', exam: 'Boards', difficulty: 'Hard', question: 'How many ways can 4 boys and 3 girls sit in a row so no two girls are adjacent?', options: ['A) 144', 'B) 1440', 'C) 5040', 'D) 2880'], correctIndex: 1, explanation: 'Boys sit in 4! = 24 ways, creating 5 gaps. Girls fill 3 of 5 gaps: 5P3 = 60. Total = 24 × 60 = 1440.' },
    { subject: 'Biology', chapter: 'Cell: The Unit of Life', exam: 'Boards', difficulty: 'Medium', question: 'Which organelle is called the "powerhouse of the cell"?', options: ['A) Nucleus', 'B) Ribosome', 'C) Golgi body', 'D) Mitochondria'], correctIndex: 3, explanation: 'Mitochondria generate most of the chemical energy needed to power the cell.' },
    { subject: 'Biology', chapter: 'Photosynthesis in Higher Plants', exam: 'Boards', difficulty: 'Easy', question: 'Light-dependent reactions of photosynthesis occur in?', options: ['A) Stroma', 'B) Thylakoid membrane', 'C) Cell wall', 'D) Cytoplasm'], correctIndex: 1, explanation: 'Light reactions occur in the thylakoid membrane; dark reactions in the stroma.' },
  ],

  'Class 12': [
    { subject: 'Physics', chapter: 'Electric Charges and Fields', exam: 'Boards', difficulty: 'Easy', question: 'What is the SI unit of electric flux?', options: ['A) N/C', 'B) N·m²/C', 'C) V/m', 'D) J/C'], correctIndex: 1, explanation: 'Electric flux = E × A, so units are (N/C) × m² = N·m²/C.' },
    { subject: 'Physics', chapter: 'Electric Charges and Fields', exam: 'Boards', difficulty: 'Medium', question: 'Two charges of +2 µC each are 30 cm apart. Force between them? (k = 9×10⁹)', options: ['A) 0.04 N', 'B) 0.4 N', 'C) 4 N', 'D) 40 N'], correctIndex: 1, explanation: 'F = k(q₁q₂)/r² = 9×10⁹ × (2×10⁻⁶)² / (0.3)² = 0.4 N.' },
    { subject: 'Physics', chapter: 'Current Electricity', exam: 'Boards', difficulty: 'Easy', question: 'Ohm\'s law relates V, I, and R as?', options: ['A) V = IR', 'B) V = I/R', 'C) V = I + R', 'D) V = R/I'], correctIndex: 0, explanation: 'Ohm\'s Law: Voltage = Current × Resistance.' },
    { subject: 'Physics', chapter: 'Current Electricity', exam: 'Boards', difficulty: 'Medium', question: 'Kirchhoff\'s Current Law states that at a node, sum of currents is?', options: ['A) Maximum', 'B) Minimum', 'C) Zero', 'D) Equal to voltage'], correctIndex: 2, explanation: 'KCL: The algebraic sum of all currents at a junction is zero (charge conservation).' },
    { subject: 'Physics', chapter: 'Semiconductor Electronics: Materials, Devices and Simple Circuits', exam: 'Boards', difficulty: 'Hard', question: 'In a p-n junction diode, the depletion layer increases in which bias?', options: ['A) Forward bias', 'B) Reverse bias', 'C) Zero bias', 'D) It remains constant'], correctIndex: 1, explanation: 'In reverse bias, the electric field pulls charge carriers away from the junction, widening the depletion layer.' },
    { subject: 'Chemistry', chapter: 'The Solid State', exam: 'Boards', difficulty: 'Easy', question: 'What is the molar mass of NaCl?', options: ['A) 58.5 g/mol', 'B) 40 g/mol', 'C) 74.5 g/mol', 'D) 117 g/mol'], correctIndex: 0, explanation: 'Na (23) + Cl (35.5) = 58.5 g/mol.' },
    { subject: 'Chemistry', chapter: 'Electrochemistry', exam: 'Boards', difficulty: 'Medium', question: 'Which electrode is the site of oxidation in a galvanic cell?', options: ['A) Cathode', 'B) Anode', 'C) Both', 'D) Neither'], correctIndex: 1, explanation: 'Oxidation occurs at the anode (OIL — Oxidation Is Loss, at the anode).' },
    { subject: 'Chemistry', chapter: 'Chemical Kinetics', exam: 'Boards', difficulty: 'Hard', question: 'For a first-order reaction, the unit of rate constant k is?', options: ['A) mol L⁻¹ s⁻¹', 'B) L mol⁻¹ s⁻¹', 'C) s⁻¹', 'D) L² mol⁻² s⁻¹'], correctIndex: 2, explanation: 'For a first-order reaction, rate = k[A], so k = rate/[A] = (mol L⁻¹ s⁻¹)/(mol L⁻¹) = s⁻¹.' },
    { subject: 'Mathematics', chapter: 'Integrals', exam: 'Boards', difficulty: 'Easy', question: '∫e^x dx = ?', options: ['A) e^x + C', 'B) xe^x + C', 'C) e^x / x + C', 'D) ln x + C'], correctIndex: 0, explanation: 'The integral of e^x is e^x + C.' },
    { subject: 'Mathematics', chapter: 'Continuity and Differentiability', exam: 'Boards', difficulty: 'Easy', question: 'Derivative of sin x is?', options: ['A) -sin x', 'B) cos x', 'C) -cos x', 'D) sec² x'], correctIndex: 1, explanation: 'd/dx(sin x) = cos x.' },
    { subject: 'Mathematics', chapter: 'Determinants', exam: 'Boards', difficulty: 'Hard', question: 'If |A| = 5 for a 2×2 matrix A, what is |3A|?', options: ['A) 15', 'B) 45', 'C) 125', 'D) 25'], correctIndex: 1, explanation: '|kA| = kⁿ|A|. Here n=2, so |3A| = 3² × 5 = 9 × 5 = 45.' },
    { subject: 'Mathematics', chapter: 'Probability', exam: 'Boards', difficulty: 'Medium', question: 'Probability of getting a head in a fair coin toss is?', options: ['A) 0', 'B) 1/4', 'C) 1/2', 'D) 1'], correctIndex: 2, explanation: 'A fair coin has 2 equally likely outcomes; P(head) = 1/2.' },
    { subject: 'Biology', chapter: 'Molecular Basis of Inheritance', exam: 'Boards', difficulty: 'Medium', question: 'Which enzyme is used to cut DNA at specific sequences?', options: ['A) DNA ligase', 'B) Helicase', 'C) Restriction endonuclease', 'D) Polymerase'], correctIndex: 2, explanation: 'Restriction endonucleases act as molecular scissors to cut DNA at specific recognition sequences.' },
    { subject: 'Biology', chapter: 'Human Health and Disease', exam: 'Boards', difficulty: 'Easy', question: 'AIDS is caused by?', options: ['A) Bacteria', 'B) Fungus', 'C) HIV virus', 'D) Protozoa'], correctIndex: 2, explanation: 'AIDS (Acquired Immunodeficiency Syndrome) is caused by the Human Immunodeficiency Virus (HIV).' },
  ],
};

// ─── Subject/Chapter structure (for topic-picker UI) ─────────────────────────
export const GRADE_SUBJECT_CHAPTERS: Record<string, Record<string, string[]>> = {
  'Class 8': {
    'Science': ['Crop Production', 'Microorganisms', 'Synthetic Fibres', 'Materials', 'Coal & Petroleum', 'Combustion', 'Conservation', 'Cell', 'Reproduction', 'Adolescence', 'Force', 'Friction', 'Sound', 'Chemical Effects', 'Natural Phenomena', 'Light', 'Stars', 'Pollution'],
    'Mathematics': ['Rational Numbers', 'Linear Equations', 'Quadrilaterals', 'Geometry', 'Data Handling', 'Squares', 'Cubes', 'Comparing Quantities', 'Expressions', 'Solid Shapes', 'Mensuration', 'Exponents', 'Proportions', 'Factorisation', 'Graphs', 'Numbers']
  },
  'Class 9': {
    'Science': ['Matter', 'Is Matter Around Us Pure', 'Atoms and Molecules', 'Structure of the Atom', 'The Fundamental Unit of Life', 'Tissues', 'Diversity in Living Organisms', 'Motion', 'Force and Laws of Motion', 'Gravitation', 'Work and Energy', 'Sound', 'Why Do We Fall Ill', 'Natural Resources', 'Improvement in Food Resources'],
    'Mathematics': ['Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations', 'Introduction to Euclid\'s Geometry', 'Lines and Angles', 'Triangles', 'Quadrilaterals', 'Areas', 'Circles', 'Constructions', 'Heron\'s Formula', 'Surface Areas and Volumes', 'Statistics', 'Probability']
  },
  'Class 10': {
    'Science': ['Chemical Reactions', 'Acids Bases Salts', 'Metals and Non-metals', 'Carbon and its Compounds', 'Periodic Classification', 'Life Processes', 'Control and Coordination', 'How do Organisms Reproduce', 'Heredity and Evolution', 'Light', 'Human Eye', 'Electricity', 'Magnetic Effects', 'Sources of Energy', 'Our Environment', 'Management of Natural Resources'],
    'Mathematics': ['Real Numbers', 'Polynomials', 'Linear Equations', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Trigonometry', 'Applications of Trigonometry', 'Circles', 'Constructions', 'Areas Related to Circles', 'Surface Areas and Volumes', 'Statistics', 'Probability']
  },
  'Class 11': {
    'Physics': ['Physical World', 'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work, Energy and Power', 'System of Particles and Rotational Motion', 'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves'],
    'Chemistry': ['Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements and Periodicity in Properties', 'Chemical Bonding and Molecular Structure', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen', 'The s-Block Elements', 'The p-Block Elements', 'Organic Chemistry - Some Basic Principles and Techniques', 'Hydrocarbons', 'Environmental Chemistry'],
    'Mathematics': ['Sets', 'Relations and Functions', 'Trigonometric Functions', 'Principle of Mathematical Induction', 'Complex Numbers and Quadratic Equations', 'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem', 'Sequence and Series', 'Straight Lines', 'Conic Sections', 'Introduction to Three Dimensional Geometry', 'Limits and Derivatives', 'Mathematical Reasoning', 'Statistics', 'Probability'],
    'Biology': ['The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom', 'Morphology of Flowering Plants', 'Anatomy of Flowering Plants', 'Structural Organisation in Animals', 'Cell: The Unit of Life', 'Biomolecules', 'Cell Cycle and Cell Division', 'Transport in Plants', 'Mineral Nutrition', 'Photosynthesis in Higher Plants', 'Respiration in Plants', 'Plant Growth and Development', 'Digestion and Absorption', 'Breathing and Exchange of Gases', 'Body Fluids and Circulation', 'Excretory Products and their Elimination', 'Locomotion and Movement', 'Neural Control and Coordination', 'Chemical Coordination and Integration']
  },
  'Class 12': {
    'Physics': ['Electric Charges and Fields', 'Electrostatic Potential and Capacitance', 'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves', 'Ray Optics and Optical Instruments', 'Wave Optics', 'Dual Nature of Radiation and Matter', 'Atoms', 'Nuclei', 'Semiconductor Electronics: Materials, Devices and Simple Circuits', 'Communication Systems'],
    'Chemistry': ['The Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'General Principles and Processes of Isolation of Elements', 'The p-Block Elements', 'The d- and f-Block Elements', 'Coordination Compounds', 'Haloalkanes and Haloarenes', 'Alcohols, Phenols and Ethers', 'Aldehydes, Ketones and Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers', 'Chemistry in Everyday Life'],
    'Mathematics': ['Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices', 'Determinants', 'Continuity and Differentiability', 'Applications of Derivatives', 'Integrals', 'Applications of the Integrals', 'Differential Equations', 'Vector Algebra', 'Three Dimensional Geometry', 'Linear Programming', 'Probability'],
    'Biology': ['Reproduction in Organisms', 'Sexual Reproduction in Flowering Plants', 'Human Reproduction', 'Reproductive Health', 'Principles of Inheritance and Variation', 'Molecular Basis of Inheritance', 'Evolution', 'Human Health and Disease', 'Strategies for Enhancement in Food Production', 'Microbes in Human Welfare', 'Biotechnology: Principles and Processes', 'Biotechnology and its Applications', 'Organisms and Populations', 'Ecosystem', 'Biodiversity and Conservation', 'Environmental Issues']
  }
};

// ─── Helper: get questions filtered by grade + subject + chapter ──────────────
// Returns questions sorted by difficulty (Easy→Medium→Hard→Extreme).
// Returns empty array if no questions exist for that chapter (triggers "still building" UI).
const DIFFICULTY_ORDER: Record<string, number> = { 'Easy': 1, 'Medium': 2, 'Hard': 3, 'Extreme': 4 };

export function getQuestionsByChapter(
  grade: string,
  subject: string,
  chapter: string,
  count = 5
): PyqQuestion[] {
  const allGradeQs = GRADE_QUESTIONS[grade] || [];
  const chapterQs = allGradeQs.filter(
    (q) => q.subject === subject && q.chapter === chapter
  );
  // Sort by difficulty ascending
  const sorted = [...chapterQs].sort(
    (a, b) => (DIFFICULTY_ORDER[a.difficulty] || 1) - (DIFFICULTY_ORDER[b.difficulty] || 1)
  );
  return sorted.slice(0, count);
}

// ─── Fallback: get questions for a grade+subject (ignoring chapter) ───────────
// Used when chapter-specific coverage doesn't exist yet.
export function getQuestionsBySubject(
  grade: string,
  subject: string,
  count = 5
): PyqQuestion[] {
  const allGradeQs = GRADE_QUESTIONS[grade] || [];
  const subjectQs = allGradeQs.filter((q) => q.subject === subject);
  const sorted = [...subjectQs].sort(
    (a, b) => (DIFFICULTY_ORDER[a.difficulty] || 1) - (DIFFICULTY_ORDER[b.difficulty] || 1)
  );
  return sorted.slice(0, count);
}
