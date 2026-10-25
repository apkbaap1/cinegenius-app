# Panchatantra kathalu · the story plan

One story a day, in Telugu, folk-tale storybook style (`folkTale`), 16:9 1920x1080, **5 to 10 minutes**
(aim for 6 to 7). The daily run takes the row whose date is today (IST). When the week is used up,
take the next unmade story from the backlog, in order, and add a dated row for it here.

| Date (IST) | Day | Story | Telugu title | Moral (card + last line) | Cast | Settings |
|---|---|---|---|---|---|---|
| 2026-10-25 | Sun | The Monkey and the Crocodile | కోతి, మొసలి | ఆపదలో తెలివే రక్ష | monkey, mugger crocodile | river, jamun tree, far village (**made**: `src/canvas-core/monkeyCroc.ts`) |
| 2026-10-26 | Mon | The Lion and the Clever Rabbit | సింహం, కుందేలు | బలం కన్నా బుద్ధి గొప్పది | lion (Bhasuraka), rabbit, a council of forest animals (deer, boar, bear, jackal) | forest clearing, the lion's den, the old well |
| 2026-10-27 | Tue | The Talkative Tortoise | వాగుడు తాబేలు | అవసరం లేని మాట ఆపద తెస్తుంది | tortoise (Kambugriva), two geese, villagers | drying lake, the sky over fields and a village |
| 2026-10-28 | Wed | The Monkey and the Wedge | కోతి, చీలిక | మనకు సంబంధం లేని పనిలో వేలు పెట్టకూడదు | a troop of monkeys, one meddling monkey, carpenters | temple building site, half-split log with a wedge |
| 2026-10-29 | Thu | The Jackal and the Drum | నక్క, డప్పు | శబ్దానికి భయపడకు, నిజం చూడు | hungry jackal (Gomaya) | old battlefield, a war drum under a tree, wind in the branches |
| 2026-10-30 | Fri | The Crows and the Serpent | కాకులు, పాము | బలం లేని చోట ఉపాయం గెలుస్తుంది | crow couple, black cobra, jackal friend, the queen's maids, guards | banyan tree, royal bathing tank, palace garden |
| 2026-10-31 | Sat | The Brahmin and the Mongoose | బ్రాహ్మణుడు, ముంగిస | తొందరపాటు పశ్చాత్తాపానికి దారి | brahmin, his wife, baby, pet mongoose, cobra | village house, courtyard, cradle |
| 2026-11-01 | Sun | The Three Fish | మూడు చేపలు | ముందుచూపే మనల్ని కాపాడుతుంది | three fish (Anagatavidhata, Pratyutpannamati, Yadbhavishya), fishermen | lake, reeds, nets, a stream to the river |

## Backlog (in order)

1. The Blue Jackal · నీలి నక్క · *నిజ స్వభావం దాచలేం*
2. The Lion and the Carpenter's Bull (Sanjeevaka) · *చెప్పుడు మాటలు నమ్మకూడదు*
3. The Heron and the Crab · కొంగ, ఎండ్రకాయ · *మోసం చేసేవాడికి మోసమే తిరిగి వస్తుంది*
4. The Mice that Set Elephants Free · ఎలుకలు, ఏనుగులు · *చిన్నవారి సాయమూ గొప్పదే*
5. The Donkey who Sang · పాడే గాడిద · *సమయం చూసి మాట్లాడాలి*
6. The Lion Makers (the four scholars) · *తెలివి కన్నా వివేకం ముఖ్యం*
7. The Dove, the Crow, the Mouse, the Deer and the Tortoise · *స్నేహమే బలం*
8. The Elephants and the Hares (the moon lake) · *ఉపాయంతో బలవంతుడిని గెలవవచ్చు*

## Reuse first

Characters and sets live in `src/canvas-core/pt/` and are POSED, never redrawn (anidoodle:
`references/workflows/character-consistency.md`). Already built: `monkey.ts`, `croc.ts`,
`river.ts` (river, far bank in pencil, jamun tree, lotus, reeds). Add each new character as its own
module there, and each new set as its own module, so later stories can reuse them (the lion, the
jackal and the crows return in the backlog).
