// Every sentence the game says out loud. Each one is a pre-recorded human voice clip
// (public/voice/<key>.mp3). The text is also used as a fallback if a clip is missing.
import { COLORS, GARAGE, LETTER_NAMES, LETTERS, NUMBER_WORDS, PEOPLE, WORDS } from "./content";
import { NEW_TRAIN_WORDS, TRAIN_LETTERS } from "./wordtrain";
import { NEW_SEA } from "./sea";
import { DIRS, SHAPES, SKY_WORDS } from "./sky";

export const NAME = "Sonny John";

export const CHEER_TEXTS = [
  `Yay, ${NAME}!`,
  `Great job, ${NAME}!`,
  `You got it, ${NAME}!`,
  `Wow, so smart, ${NAME}!`,
  "Awesome!",
  "Zoom zoom!",
  `Super driver, ${NAME}!`,
  `Way to go, ${NAME}!`,
];
export const CHEER_KEYS = CHEER_TEXTS.map((_, i) => `cheer_${i}`);

// letters whose phonetic spelling the voice reads unreliably: say "C is for car" instead
const NAME_ONLY_SOUND = new Set(["C", "E", "J", "Q", "T"]);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function buildLines(): Record<string, string> {
  const L: Record<string, string> = {};
  const set = (key: string, text: string) => {
    L[key] = text;
  };

  // numbers
  for (let n = 1; n <= 10; n++) L[`n_${n}`] = `${cap(NUMBER_WORDS[n] ?? "")}!`;

  // letters
  for (const l of LETTERS) {
    const name = l.letter;
    L[`letter_${l.letter}`] = `The letter ${name}.`;
    L[`not_${l.letter}`] = `That's the letter ${name}.`;
    L[`sound_${l.letter}`] = NAME_ONLY_SOUND.has(l.letter)
      ? `${name} is for ${l.word}!`
      : `${name} says ${l.sound}, like ${l.word}!`;
    L[`find_${l.letter}`] = `Find the letter ${name}!`;
    L[`findlow_${l.letter}`] = `Find the little ${name}!`;
  }

  // words
  for (const w of WORDS) {
    const spelled = w.word
      .split("")
      .map((c) => c.toUpperCase())
      .join(", ");
    const isName = w.word === "SONNY" || w.word === "JOHN";
    const lower = w.word.toLowerCase();
    const said = isName ? cap(lower) : lower;
    L[`spell_${w.word}`] = `Let's spell ${said}!`;
    L[`word_${w.word}`] =
      `${spelled}. ${cap(said)}! You spelled ${said}!${w.special ? ` ${w.special}` : ""}`;
  }

  // "which letter does CAR start with?"
  for (const w of WORDS) {
    const said = w.word === "SONNY" ? NAME : w.word === "JOHN" ? "John" : w.word.toLowerCase();
    L[`starts_${w.word}`] = `Which letter does ${said} start with?`;
  }

  // the people in Sonny John's life
  for (const p of PEOPLE) {
    const mine = !/^(Grandma|Grandpa|Big Papa|Mimi)/.test(p.say);
    const who = mine ? `your ${p.role}, ${p.say}` : p.say;
    L[`where_${p.id}`] = `Where is ${who}?`;
    L[`yes_${p.id}`] = mine ? `Yes! That's ${p.say}! Your ${p.role}!` : `Yes! That's ${p.say}!`;
  }

  // colors / counting
  for (const c of COLORS) {
    L[`cq_${c.name}`] = `Count the ${c.name} cars! How many ${c.name} cars?`;
    L[`cr_${c.name}`] = `${cap(c.name)} cars!`;
    L[`cr1_${c.name}`] = `${cap(c.name)} car!`;
  }
  set("yes", "Yes!");
  for (let n = 1; n <= 10; n++) L[`no_n_${n}`] = `That's ${NUMBER_WORDS[n]}.`;
  set("lets_count", "Let's count together!");
  set("try_again", "Try again!");
  set("oops", "Oops!");

  // new counting games
  for (let n = 1; n <= 10; n++)
    L[`park_${n}`] = `Park ${NUMBER_WORDS[n]} ${n === 1 ? "car" : "cars"}! Tap a car to park it.`;
  set("more_q", "Which side has more cars?");
  set("fewer_q", "Which side has fewer cars?");
  set("more_yes", "Yes! That side has more cars!");
  set("fewer_yes", "Yes! That side has fewer cars!");
  set("count_each", "Let's count each side!");
  set("left_side", "This side.");
  set("right_side", "That side.");
  set("same_q", "Both sides are the same!");
  set("traffic_q", "Look at all the cars!");

  // ghost game
  set("g_hello", "Boo! Let's play the ghost game!");
  set("g_q", "Count the ghosts! How many ghosts?");
  set("g_n", "ghosts!");
  set("g_1", "ghost!");
  set("g_add", "Let's put the ghosts together! How many in all?");
  set("g_all", "ghosts in all!");
  set("g_sub", "Some ghosts flew away! How many are left?");
  set("g_left", "ghosts left!");
  set("g_left1", "ghost left!");
  set("g_more", "Which side has more ghosts?");
  set("g_more_yes", "Yes! That side has more ghosts!");
  set("g_boo", "Boo!");
  set("g_peek", `Peekaboo! It's ${NAME}!`);

  // soccer game
  set("sc_hello", `Goal! Let's play soccer with ${NAME} and Rome!`);
  set("sc_q", "Count the soccer balls! How many balls?");
  set("sc_qp", "Count the players! How many players?");
  set("sc_ball", "balls!");
  set("sc_ball1", "ball!");
  set("sc_pl", "players!");
  set("sc_pl1", "player!");
  set("sc_add", "Let's put the balls together! How many in all?");
  set("sc_all", "balls in all!");
  set("sc_sub", "Some balls rolled away! How many are left?");
  set("sc_left", "balls left!");
  set("sc_left1", "ball left!");
  set("sc_more", "Which team has more balls?");
  set("sc_more_yes", "Yes! That team has more balls!");
  set("sc_goal", "Goal!");

  // car show race
  set("cs_hello", "Let's race at the car show!");
  set("cs_q", "Count the cars! How many cars?");
  set("cs_car", "cars!");
  set("cs_car1", "car!");
  set("cs_add", "Let's park the cars together! How many in all?");
  set("cs_all", "cars in all!");
  set("cs_sub", "Some cars drove away! How many are left?");
  set("cs_left", "cars left!");
  set("cs_left1", "car left!");
  set("cs_go", "Ready, set, go!");
  set("cs_win", "You win the race!");

  // number train
  const TEENS = [
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
    "twenty",
  ];
  TEENS.forEach((w, i) => (L[`n_${i + 11}`] = `${cap(w)}!`));
  set("nt_hello", "All aboard the number train!");
  set("nt_next", "What number comes next?");
  set("nt_miss", "What number is missing?");
  set("nt_big", "Which number is bigger?");
  set("nt_small", "Which number is smaller?");
  set("nt_before", "What number comes before?");

  // pattern parade
  set("pt_hello", "Let's make patterns!");
  set("pt_q", "What comes next?");
  set("pt_yes", "Yes! You finished the pattern!");
  for (const c of COLORS) L[`col_${c.name}`] = `${cap(c.name)}!`;

  // vocabulary games
  set("vp_dog", "Find the dog!");
  set("vy_dog", "Yes! That's a dog!");
  set("vp_cat", "Find the cat!");
  set("vy_cat", "Yes! That's a cat!");
  set("vp_cow", "Find the cow!");
  set("vy_cow", "Yes! That's a cow!");
  set("vp_pig", "Find the pig!");
  set("vy_pig", "Yes! That's a pig!");
  set("vp_duck", "Find the duck!");
  set("vy_duck", "Yes! That's a duck!");
  set("vp_fish", "Find the fish!");
  set("vy_fish", "Yes! That's a fish!");
  set("vp_bird", "Find the bird!");
  set("vy_bird", "Yes! That's a bird!");
  set("vp_horse", "Find the horse!");
  set("vy_horse", "Yes! That's a horse!");
  set("vp_lion", "Find the lion!");
  set("vy_lion", "Yes! That's a lion!");
  set("vp_frog", "Find the frog!");
  set("vy_frog", "Yes! That's a frog!");
  set("vp_giraffe", "Find the giraffe!");
  set("vy_giraffe", "Yes! That's a giraffe!");
  set("vp_apple", "Find the apple!");
  set("vy_apple", "Yes! That's an apple!");
  set("vp_banana", "Find the banana!");
  set("vy_banana", "Yes! That's a banana!");
  set("vp_pizza", "Find the pizza!");
  set("vy_pizza", "Yes! That's pizza!");
  set("vp_cookie", "Find the cookie!");
  set("vy_cookie", "Yes! That's a cookie!");
  set("vp_milk", "Find the milk!");
  set("vy_milk", "Yes! That's milk!");
  set("vp_bread", "Find the bread!");
  set("vy_bread", "Yes! That's bread!");
  set("vp_grapes", "Find the grapes!");
  set("vy_grapes", "Yes! Those are grapes!");
  set("vp_car", "Find the car!");
  set("vy_car", "Yes! That's a car!");
  set("vp_bus", "Find the bus!");
  set("vy_bus", "Yes! That's a bus!");
  set("vp_truck", "Find the truck!");
  set("vy_truck", "Yes! That's a truck!");
  set("vp_boat", "Find the boat!");
  set("vy_boat", "Yes! That's a boat!");
  set("vp_plane", "Find the plane!");
  set("vy_plane", "Yes! That's a plane!");
  set("vp_train", "Find the train!");
  set("vy_train", "Yes! That's a train!");
  set("vp_hand", "Find the hand!");
  set("vy_hand", "Yes! That's a hand!");
  set("vp_foot", "Find the foot!");
  set("vy_foot", "Yes! That's a foot!");
  set("vp_nose", "Find the nose!");
  set("vy_nose", "Yes! That's a nose!");
  set("vp_eye", "Find the eye!");
  set("vy_eye", "Yes! That's an eye!");
  set("vp_ear", "Find the ear!");
  set("vy_ear", "Yes! That's an ear!");
  set("vp_mouth", "Find the mouth!");
  set("vy_mouth", "Yes! That's a mouth!");
  set("vp_hair", "Find the hair!");
  set("vy_hair", "Yes! That's hair!");
  set("vp_head", "Find the head!");
  set("vy_head", "Yes! That's a head!");
  set("vp_hat", "Find the hat!");
  set("vy_hat", "Yes! That's a hat!");
  set("vp_shoe", "Find the shoe!");
  set("vy_shoe", "Yes! That's a shoe!");
  set("vp_shirt", "Find the shirt!");
  set("vy_shirt", "Yes! That's a shirt!");
  set("vp_sunglasses", "Find the sunglasses!");
  set("vy_sunglasses", "Yes! Those are sunglasses!");
  set("vp_socks", "Find the socks!");
  set("vy_socks", "Yes! Those are socks!");
  set("vp_sun", "Find the sun!");
  set("vy_sun", "Yes! That's the sun!");
  set("vp_moon", "Find the moon!");
  set("vy_moon", "Yes! That's the moon!");
  set("vp_star", "Find the star!");
  set("vy_star", "Yes! That's a star!");
  set("vp_tree", "Find the tree!");
  set("vy_tree", "Yes! That's a tree!");
  set("vp_flower", "Find the flower!");
  set("vy_flower", "Yes! That's a flower!");
  set("vp_ball", "Find the ball!");
  set("vy_ball", "Yes! That's a ball!");
  set("vp_book", "Find the book!");
  set("vy_book", "Yes! That's a book!");
  set("vp_house", "Find the house!");
  set("vy_house", "Yes! That's a house!");
  set("vc_animal", "Tap the animal!");
  set("vc_food", "Tap the food!");
  set("vc_vehicle", "Tap the vehicle!");
  set("vc_body", "Tap the body part!");
  set("vc_clothes", "Tap the clothes!");
  set("vc_outside", "Tap the one you see outside!");
  set("op_big", "Which one is big?");
  set("ow_big", "Big!");
  set("op_small", "Which one is small?");
  set("ow_small", "Small!");
  set("op_hot", "Which one is hot?");
  set("ow_hot", "Hot!");
  set("op_cold", "Which one is cold?");
  set("ow_cold", "Cold!");
  set("op_happy", "Which one is happy?");
  set("ow_happy", "Happy!");
  set("op_sad", "Which one is sad?");
  set("ow_sad", "Sad!");
  set("op_fast", "Which one is fast?");
  set("ow_fast", "Fast!");
  set("op_slow", "Which one is slow?");
  set("ow_slow", "Slow!");
  set("op_day", "Which one is day?");
  set("ow_day", "Day!");
  set("op_night", "Which one is night?");
  set("ow_night", "Night!");
  set("op_wet", "Which one is wet?");
  set("ow_wet", "Wet!");
  set("op_dry", "Which one is dry?");
  set("ow_dry", "Dry!");
  set("op_up", "Which one is up?");
  set("ow_up", "Up!");
  set("op_down", "Which one is down?");
  set("ow_down", "Down!");
  set("op_loud", "Which one is loud?");
  set("ow_loud", "Loud!");
  set("op_quiet", "Which one is quiet?");
  set("ow_quiet", "Quiet!");
  set("op_full", "Which one is full?");
  set("ow_full", "Full!");
  set("op_empty", "Which one is empty?");
  set("ow_empty", "Empty!");
  set("op_open", "Which one is open?");
  set("ow_open", "Open!");
  set("op_closed", "Which one is closed?");
  set("ow_closed", "Closed!");
  set("rh_cat", "Which one rhymes with cat?");
  set("ry_cat", "Yes! Cat and hat rhyme!");
  set("rh_hat", "Which one rhymes with hat?");
  set("ry_hat", "Yes! Hat and cat rhyme!");
  set("rh_dog", "Which one rhymes with dog?");
  set("ry_dog", "Yes! Dog and frog rhyme!");
  set("rh_frog", "Which one rhymes with frog?");
  set("ry_frog", "Yes! Frog and dog rhyme!");
  set("rh_bee", "Which one rhymes with bee?");
  set("ry_bee", "Yes! Bee and tree rhyme!");
  set("rh_tree", "Which one rhymes with tree?");
  set("ry_tree", "Yes! Tree and bee rhyme!");
  set("rh_sun", "Which one rhymes with sun?");
  set("ry_sun", "Yes! Sun and run rhyme!");
  set("rh_run", "Which one rhymes with run?");
  set("ry_run", "Yes! Run and sun rhyme!");
  set("rh_star", "Which one rhymes with star?");
  set("ry_star", "Yes! Star and car rhyme!");
  set("rh_car", "Which one rhymes with car?");
  set("ry_car", "Yes! Car and star rhyme!");
  set("rh_bear", "Which one rhymes with bear?");
  set("ry_bear", "Yes! Bear and chair rhyme!");
  set("rh_chair", "Which one rhymes with chair?");
  set("ry_chair", "Yes! Chair and bear rhyme!");
  set("rh_cake", "Which one rhymes with cake?");
  set("ry_cake", "Yes! Cake and snake rhyme!");
  set("rh_snake", "Which one rhymes with snake?");
  set("ry_snake", "Yes! Snake and cake rhyme!");
  set("rh_moon", "Which one rhymes with moon?");
  set("ry_moon", "Yes! Moon and spoon rhyme!");
  set("rh_spoon", "Which one rhymes with spoon?");
  set("ry_spoon", "Yes! Spoon and moon rhyme!");
  set("mm_q", "Find the matching pictures!");
  set("v_hello", "Let's learn some words!");
  set("s_hello", "Let's sort things into groups!");
  set("o_hello", "Let's find the opposites!");
  set("r_hello", "Let's find the rhymes!");
  set("f_hello", "Look at the picture!");
  set("mm_yes", "You found a match!");
  set("rm_q", "Find the words that rhyme!");
  set("mm_peek", "Look carefully! Remember where they are!");
  set("mo_watch", "Watch carefully!");
  set("mo_turn", "Your turn! Copy me!");
  set("mx_q", "What's missing?");
  set("vp_sirius", "Find Sirius!");
  set("vy_sirius", "Yes! That's Sirius, your sister!");
  set("rh_fox", "Which one rhymes with fox?");
  set("ry_fox", "Yes! Fox and box rhyme!");
  set("rh_mouse", "Which one rhymes with mouse?");
  set("ry_mouse", "Yes! Mouse and house rhyme!");
  set("rh_bed", "Which one rhymes with bed?");
  set("ry_bed", "Yes! Bed and red rhyme!");
  set("rh_fish", "Which one rhymes with fish?");
  set("ry_fish", "Yes! Fish and dish rhyme!");
  set("rh_ball", "Which one rhymes with ball?");
  set("ry_ball", "Yes! Ball and wall rhyme!");
  set("rh_bug", "Which one rhymes with bug?");
  set("ry_bug", "Yes! Bug and mug rhyme!");
  set("rh_boat", "Which one rhymes with boat?");
  set("ry_boat", "Yes! Boat and goat rhyme!");
  set("rh_king", "Which one rhymes with king?");
  set("ry_king", "Yes! King and ring rhyme!");
  set("rh_pen", "Which one rhymes with pen?");
  set("ry_pen", "Yes! Pen and hen rhyme!");
  set("rh_clock", "Which one rhymes with clock?");
  set("ry_clock", "Yes! Clock and sock rhyme!");
  set("rh_train", "Which one rhymes with train?");
  set("ry_train", "Yes! Train and rain rhyme!");
  set("rh_nose", "Which one rhymes with nose?");
  set("ry_nose", "Yes! Nose and rose rhyme!");
  set("rh_truck", "Which one rhymes with truck?");
  set("ry_truck", "Yes! Truck and duck rhyme!");
  set("rh_book", "Which one rhymes with book?");
  set("ry_book", "Yes! Book and hook rhyme!");

  // places, world, name cheers
  set("fp_living_room", "Find the living room!");
  set("fy_living_room", "Yes! That's the living room!");
  set("fp_kitchen", "Find the kitchen!");
  set("fy_kitchen", "Yes! That's the kitchen!");
  set("fp_bedroom", "Find the bedroom!");
  set("fy_bedroom", "Yes! That's the bedroom!");
  set("fp_bathroom", "Find the bathroom!");
  set("fy_bathroom", "Yes! That's the bathroom!");
  set("fp_dining_room", "Find the dining room!");
  set("fy_dining_room", "Yes! That's the dining room!");
  set("fp_back_yard", "Find the back yard!");
  set("fy_back_yard", "Yes! That's the back yard!");
  set("fp_patio", "Find the patio!");
  set("fy_patio", "Yes! That's the patio!");
  set("fp_garage", "Find the garage!");
  set("fy_garage", "Yes! That's the garage!");
  set("fp_store", "Find the store!");
  set("fy_store", "Yes! That's the store!");
  set("fp_gas_station", "Find the gas station!");
  set("fy_gas_station", "Yes! That's the gas station!");
  set("fp_laundromat", "Find the laundromat!");
  set("fy_laundromat", "Yes! That's the laundromat!");
  set("fp_police_station", "Find the police station!");
  set("fy_police_station", "Yes! That's the police station!");
  set("fp_hospital", "Find the hospital!");
  set("fy_hospital", "Yes! That's the hospital!");
  set("fp_fire_station", "Find the fire station!");
  set("fy_fire_station", "Yes! That's the fire station!");
  set("fp_school", "Find the school!");
  set("fy_school", "Yes! That's the school!");
  set("fp_park", "Find the park!");
  set("fy_park", "Yes! That's the park!");
  set("fp_library", "Find the library!");
  set("fy_library", "Yes! That's the library!");
  set("fp_church", "Find the church!");
  set("fy_church", "Yes! That's the church!");
  set("fp_restaurant", "Find the restaurant!");
  set("fy_restaurant", "Yes! That's the restaurant!");
  set("fp_post_office", "Find the post office!");
  set("fy_post_office", "Yes! That's the post office!");
  set("fp_bank", "Find the bank!");
  set("fy_bank", "Yes! That's the bank!");
  set("fp_airport", "Find the airport!");
  set("fy_airport", "Yes! That's the airport!");
  set("fp_grocery_store", "Find the grocery store!");
  set("fy_grocery_store", "Yes! That's the grocery store!");
  set("fp_carrollton", "Find Carrollton!");
  set("fy_carrollton", "Yes! That's Carrollton!");
  set("fp_georgia", "Find Georgia!");
  set("fy_georgia", "Yes! That's Georgia!");
  set("fp_usa", "Find USA!");
  set("fy_usa", "Yes! That's USA!");
  set("fp_united_states", "Find the United States!");
  set("fy_united_states", "Yes! That's the United States!");
  set("fp_america", "Find America!");
  set("fy_america", "Yes! That's America!");
  set("fp_guyana", "Find Guyana!");
  set("fy_guyana", "Yes! That's Guyana!");
  set("p_hello", "Let's learn about places!");
  set("w_hello", "Let's learn about our world!");
  set("nm_0", "Good job, Sonny John!");
  set("nm_1", "Yes, Sonny John!");
  set("nm_3", "That's right, Sonny John!");
  set("nm_5", "Smart boy, Sonny John!");
  set("nm_4", "Sonny, you know it!");

  // word train
  set("tw_start", `All aboard, ${NAME}! Let's go!`);
  set("tw_toword", "Choo choo! Let's drop off the letters!");
  set("tw_spellit", "Now spell the word! What comes next?");
  for (const w of NEW_TRAIN_WORDS) set(`tw_${w}`, `Let's spell ${w}!`);
  for (const l of TRAIN_LETTERS) {
    set(`tp_${l}`, `Pick up the letter ${l}!`);
    set(`td_${l}`, `Drop off the letter ${l}!`);
  }

  // boat captain
  set("bt_start", `Anchors aweigh, ${NAME}! Let's sail!`);
  set("bt_loaded", "All loaded! Off we sail!");
  for (const w of NEW_SEA) {
    set(`bq_${w.id}`, `Find the ${w.id}!`);
    set(`by_${w.id}`, `Yes! That's ${w.a} ${w.id}!`);
  }
  for (let n = 1; n <= 8; n++)
    set(`bl_${n}`, `Load ${NUMBER_WORDS[n]} ${n === 1 ? "crate" : "crates"} onto the boat!`);
  for (const c of COLORS) set(`bc_${c.name}`, `Find the ${c.name} boat!`);

  // sky pilot
  set("ap_start", `Pilot ${NAME}, ready for takeoff!`);
  set("ap_num", "Fly through the number");
  for (const w of SKY_WORDS) {
    set(`ap_q_${w.id}`, `Fly through the ${w.id}!`);
    set(`ap_y_${w.id}`, `Yes! That's ${w.a} ${w.id}!`);
  }
  for (const sh of SHAPES) {
    set(`ap_s_${sh}`, `Fly through the ${sh}!`);
    set(`ap_ys_${sh}`, `Yes! That's a ${sh}!`);
  }
  for (const d of DIRS) {
    set(`ap_d_${d}`, `Fly ${d}!`);
    set(`ap_dy_${d}`, `Yes! That's ${d}!`);
  }

  // cheers + finishing
  CHEER_TEXTS.forEach((t, i) => (L[`cheer_${i}`] = t));
  set("fin_1", `You did it, ${NAME}! You earned one star!`);
  set("fin_2", `You did it, ${NAME}! You earned two stars!`);
  set("new_car", "And you unlocked a new car!");
  for (const c of GARAGE) L[`car_${c.id}`] = `${c.name}!`;
  set("more_stars", "more stars to unlock this car!");
  set("more_star", "more star to unlock this car!");
  set("hello", `Hi ${NAME}! Let's learn and race!`);

  return L;
}

export const LINES = buildLines();
export type VoiceKey = keyof typeof LINES & string;

// keep a reference so unused-export tooling doesn't drop the data this file builds from
void LETTER_NAMES;
