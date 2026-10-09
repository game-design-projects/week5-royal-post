// Every word the two royals say. Pure data; src/story.js decides which variant
// is in play. A body item is a paragraph string, or {verse}, {list}, or {del}
// (a crossed-out line — the player only ever sees it by peeking).

export const CHARACTERS = {
  prince: {
    id: 'prince',
    name: 'Prince Florian',
    home: 'Highroost',
    seal: 'sun',
    unit: 'pages',
  },
  princess: {
    id: 'princess',
    name: 'Princess Maren',
    home: 'Westmere',
    seal: 'wheat',
    unit: 'card',
  },
};

// LETTERS[day][variant]
export const LETTERS = {
  1: {
    proposal: {
      title: 'The Proposal',
      from: 'prince', to: 'princess', pages: 11, weight: 'heavy',
      salutation: 'To Her Serene and Most Sensible Highness, Maren of Westmere, Keeper of the Western Granaries, Lady of the Tower, Light of the Lesser Hemisphere —',
      body: [
        'Greetings from Highroost, where the sun rises first, as is only fitting. I write to you by the light of eleven candles, one for each of my principal virtues, which I shall list presently — for a man who does not know his own virtues can hardly be expected to share them.',
        'Allow me to introduce myself, though I suspect no introduction is needed. I am Florian Augustin Peregrine Valoris, Crown Prince of Highroost, Defender of the Eastern Hills, Warden of the Ninth Bell Tower, Patron of the Royal Society for the Appreciation of Florian, and third-place finisher in the Junior Joust of my fourteenth year. The trophy is very large. I have had a second, larger case made for it.',
        'As you will know, our two kingdoms share a world of modest proportions: one may walk around it in an afternoon, if one is the walking sort, which I am not, having a horse, two carriages and a pigeon. The Treaty of the Short Horizon binds us to marry by the Harvest Moon. Lesser men would call this an obligation. I call it destiny with a deadline.',
        'I have composed in your honour an ode of forty verses, entitled Ode to a Princess I Have Read About, which is available upon request — or without request, as I intend to send it regardless. Verse eleven rhymes “Westmere” with “best here”, which the court poet assures me has never been attempted.',
        'I am told you are fond of ledgers. I too am fond of ledgers, in the sense that I have seen several and was not displeased. I am told you do not care for parties. This is understandable, as you have not yet attended one of mine.',
        'My portrait accompanies this letter (pages four through seven). The painter has captured my jaw, which is generally agreed to be the finest in the eastern hemisphere — though, in fairness, the eastern hemisphere has only the one prince.',
        'I await your reply with the patience of a mountain and the ardour of a volcano, which is to say: a mountain that is about to become very impatient indeed.',
      ],
      signoff: 'With every affection a heart of my considerable size can hold,',
      signature: 'Florian Augustin Peregrine Valoris, Crown Prince of Highroost, &c., &c., &c.',
      postscript: [{ del: 'P.S. I have never actually met you and I am terrified.' }],
      pickup: {
        line: 'Ah, my winged herald! I hereby name you Zephyrine the Swift. Bear this to the Princess with all speed — it is eleven pages, so: all the speed you can manage while carrying eleven pages.',
        name: 'Zephyrine the Swift',
      },
      arrive: 'Eleven pages. Four of them are a portrait. …He has a nice jaw. Don’t tell him.',
      sealLine: 'Seal’s broken. Someone read this. Fine — there’s nothing in it he wouldn’t say to a crowd.',
      lost: 'Eleven pages scatter across the hills. A shepherd will spend the winter reading about the Junior Joust.',
    },
  },

  2: {
    received: {
      title: 'Received',
      from: 'princess', to: 'prince', pages: 1, weight: 'light',
      salutation: 'Florian —',
      body: [
        'Received. Eleven pages, four of them portrait.',
        'The treaty says we marry by the Harvest Moon. I’ll honour it.',
        'The ode is not required.',
      ],
      signature: '— M.',
      postscript: [{ del: '“Best here” was a crime.' }],
      pickup: { line: 'Pigeon. Take this back to him. It’s short; you’ll manage.' },
      arrive: '“The ode is not required.” Not required! She means not required yet. Bring me more parchment.',
      lost: 'The little card spins down like a sycamore seed. Somewhere, an ode is still not required.',
    },
    silence: {
      title: 'Nothing Arrived',
      from: 'princess', to: 'prince', pages: 1, weight: 'light',
      salutation: 'Florian —',
      body: [
        'Your pigeon arrived with nothing but a look of guilt.',
        'If you meant to write, write.',
        'The treaty says we marry by the Harvest Moon.',
      ],
      signature: '— M.',
      pickup: { line: 'Pigeon. You came with nothing. Take this — and try to keep hold of it.' },
      arrive: '“If you meant to write, write”? I did write! Eleven pages! …Pigeon. Did you eat them?',
      lost: 'The card goes the way of the last letter. Two lost in a row; the hills are getting well read.',
    },
  },

  3: {
    ode: {
      title: 'The Ode',
      from: 'prince', to: 'princess', pages: 9, weight: 'heavy',
      salutation: 'Most Concise Highness —',
      body: [
        'Your letter arrived and was read aloud to the whole court, which took less time than anyone expected. The court applauded, then waited, then applauded again in case there was more.',
        '“The ode is not required,” you wrote. I have reflected upon this for two whole days and concluded that it is modesty, and that modesty must be answered with generosity. Here, then, is the ode. Nine stanzas; I have cut thirty-one, for the pigeon’s sake.',
        { verse: 'O Maren, moon of Westmere’s sky,\nWho rises pale while I rise high —\nI am the sun (I’ve checked), and you\nReflect me, as the moon must do.' },
        { verse: 'Your tower’s thin, your letters thinner,\nYour granary’s a hall of dinner;\nMy halls are wide, my verses wide —\nTogether, we’d be very wide.' },
        { verse: 'They say you count the grain at night.\nThen count my virtues! Use the light\nOf all the candles I have lit —\n(Eleven. Please make note of it.)' },
        { verse: 'I’ve never seen your face, ’tis true.\nThe painter said you’d not sit through\nA sitting, so he drew a moon.\nI’ve hung it by my own. Come soon.' },
        { verse: 'So let the Harvest Moon come round\nAnd let the wedding bells resound;\nThe sun and moon at last shall meet —\n(The sun has ordered boots. They’re neat.)' },
        'Stanzas six through nine follow under separate cover, as your pigeon looked at me in a way I can only describe as pleading.',
      ],
      signoff: 'Radiantly,',
      signature: 'Florian, Sun of the East (self-appointed, but widely seconded)',
      postscript: [{ del: 'What do you like? Nobody has ever told me what you like.' }],
      pickup: {
        line: 'Aethon the Unwearied! Behold — an ode. Do not read it on the way; it would ruin you for all other poetry.',
        name: 'Aethon the Unwearied',
      },
      arrive: '“The sun has ordered boots. They’re neat.” …I’ll write back. Something short. He needs something short.',
      sealLine: 'The seal’s cracked. You read the poem? I’m sorry. Sit down a moment.',
      lost: 'Nine stanzas sink into the sea. The fish are unmoved, which is the correct response.',
    },
    elaborate: {
      title: 'Allow Me to Elaborate',
      from: 'prince', to: 'princess', pages: 14, weight: 'heaviest',
      salutation: 'Most Silent Highness —',
      body: [
        'No reply has come. My pigeon returned bearing nothing, and wearing an expression I did not care for. I can only conclude that my first letter was too modest. Allow me to elaborate.',
        'Additional virtues, previously unmentioned:',
        {
          list: [
            'Twelve. I can whistle in two keys, though not at the same time.',
            'Thirteen. Horses respect me.',
            'Fourteen. I have read a book, cover to cover, on the history of buttons.',
            'Fifteen. I am kind to the staff, who say so whenever I ask them.',
            'Sixteen. I have never once been seasick, having never once been to sea.',
          ],
        },
        'I enclose, besides, the full ode of forty verses, an index to the ode, a second portrait (profile, from the left), a pressed rose from the castle garden, and a lock of my hair, which the barber assures me is customary.',
        'If my first letter offended, it can only have been through brevity, and for that I apologise. I shall not make the same mistake again.',
      ],
      signoff: 'Expansively,',
      signature: 'Florian Augustin Peregrine Valoris, Crown Prince of Highroost, Defender of the Eastern Hills, &c., &c., &c., &c.',
      postscript: [{ del: 'Did I say something wrong? I always say something wrong.' }],
      pickup: {
        line: 'Sir Coo of the Eastern Gale! She has not written. Clearly I was too brief. Take these fourteen pages. Lift with your legs.',
        name: 'Sir Coo of the Eastern Gale',
      },
      arrive: 'Fourteen pages. Number thirteen: “Horses respect me.” …He sounds frightened. Of me, I think.',
      sealLine: 'Broken seal. If you read all fourteen pages, you’ve earned a rest.',
      lost: 'Fourteen pages, an index and a lock of hair go down together. The sea will need a librarian.',
    },
  },

  4: {
    ask: {
      title: 'One True Thing',
      from: 'princess', to: 'prince', pages: 1, weight: 'light',
      salutation: 'Florian.',
      body: [
        'Stop writing poems.',
        'Tell me one true thing about yourself. Something nobody would put on a banner.',
      ],
      signature: '— M.',
      postscript: ['P.S. Feed the pigeon.', { del: 'I read all eleven pages twice.' }],
      pickup: {
        line: 'Pigeon. You look thin. Eat this first. …Now take this to him. It’s a question. I’d like an answer.',
        feed: { stamina: 1, crumbs: 10 },
      },
      arrive: '“One true thing.” …Leave me, Pigeon. I need to think, which I gather is different from composing.',
      sealLine: 'Her seal — broken. You read it, then. You know what she’s asking. Don’t look at me like that.',
      lost: 'The little card is gone, and the question with it. Somewhere, a prince keeps writing poems.',
    },
    silence: {
      title: 'One True Thing',
      from: 'princess', to: 'prince', pages: 1, weight: 'light',
      salutation: 'Florian.',
      body: [
        'Three days and nothing. Either you’ve run out of adjectives or something is wrong.',
        'Stop writing poems, if you are writing them. Tell me one true thing about yourself. Something nobody would put on a banner.',
      ],
      signature: '— M.',
      postscript: ['P.S. Feed the pigeon.', { del: 'I read all eleven pages twice.' }],
      pickup: {
        line: 'Pigeon. You look thin — and you came empty again. Eat this first. …Now take this to him. It’s a question. I’d like an answer.',
        feed: { stamina: 1, crumbs: 10 },
      },
      arrive: '“Three days and nothing”? I sent nine stanzas! …“One true thing.” Hm. Leave me, Pigeon.',
      sealLine: 'Her seal — broken. You read it, then. You know what she’s asking. Don’t look at me like that.',
      lost: 'The little card is gone, and the question with it. Somewhere, a prince keeps writing poems.',
    },
  },

  5: {
    true: {
      title: 'The True Thing',
      from: 'prince', to: 'princess', pages: 1, unit: 'page', weight: 'light',
      salutation: 'Maren.',
      body: [
        'One true thing: I came third in the Junior Joust because there were three of us.',
        'Another, since I’m here: I’m afraid of heights, which is inconvenient in a castle. I sleep on the ground floor and tell everyone it’s for the acoustics.',
        'I wrote you eleven pages because I didn’t think one would be enough. This is one page. I’m trying.',
      ],
      signature: '— Florian. (Just Florian.)',
      postscript: ['P.S. I fed the pigeon. It seemed surprised.'],
      pickup: {
        line: 'I was going to call you Boreas the Indomitable. But you’re a pigeon, and she asked me to feed you. Here. …And this. It’s only one page.',
        name: 'Pigeon',
        feed: { stamina: 1, crumbs: 5 },
      },
      arrive: '(She reads it twice.) “Third, because there were three of us.” (She laughs, once, quietly.) All right, Florian.',
      sealLine: 'Seal’s broken. So you read it too. Then you know.',
      lost: 'One page — the only true one he ever wrote — slips away on the wind.',
    },
    candlelight: {
      title: 'By Candlelight',
      from: 'prince', to: 'princess', pages: 4, weight: 'medium',
      salutation: 'Maren —',
      body: [
        'Your letter reached me after dark, and I read it by candlelight, which seemed appropriate, and then I sat with it for a long time, which did not.',
        'One true thing. Very well. I am not as tall as the portrait. That is a true thing, though I suspect it is not the one you meant.',
        'There is another, larger one. I had it on the end of my quill just now —',
        { del: 'I’m afraid of heights. I came third because there were three of us. I’m afraid of you.' },
        '— and then the candle guttered, and I thought: what would a prince say? And so, instead, behold: a sonnet upon the subject of Truth itself, each line more sincere than the last.',
        { verse: 'O Truth! thou rarest jewel in the crown,\nThou fairest bird that ever flew to town,\nI hold thee up, I hold thee to the light —\nI hold thee, Maren, nearly every night.' },
        'The remaining ten lines are, if anything, truer.',
      ],
      signoff: 'Yours in ink and in earnest,',
      signature: 'Florian Augustin Peregrine Valoris, &c.',
      pickup: {
        line: 'Nyx, Bearer of Midnight Tidings — no. Wait. Just… take it. Before I add anything.',
        name: 'Nyx, Bearer of Midnight Tidings',
      },
      arrive: 'He almost said it. Look — here, where the ink goes thick. And then a sonnet.',
      sealLine: 'Seal’s broken. Did you see what he crossed out? So did I.',
      lost: 'Four pages, half of them true, flutter into the dark.',
    },
    cantos: {
      title: 'Twelve Cantos',
      from: 'prince', to: 'princess', pages: 12, weight: 'heaviest',
      salutation: 'Most Silent, Most Distant Highness —',
      body: [
        'The Harvest Moon approaches, and my pigeon returns each day bearing nothing. Very well. If you will not write, I shall write enough for us both. I give you: A Royal Proclamation of Love, in Twelve Cantos.',
        {
          list: [
            'Canto I. Of the Prince’s Birth, Which Was Remarked Upon.',
            'Canto II. Of the Junior Joust, and the Trophy.',
            'Canto III. Of the Second, Larger Trophy Case.',
            'Canto IV. Of the Prince’s Jaw, in Profile, from the Left.',
            'Canto V. Of the Treaty, and of Destiny, and of Deadlines.',
            'Canto VI. Of Horses, Who Respect Him.',
            'Canto VII. Of Buttons: a Digression.',
            'Canto VIII. Of the Moon, Who Does Not Write Back.',
            'Canto IX. Of the Sun, Who Is Fine About It.',
            'Canto X. Of the Sun, Who Is Completely Fine.',
            'Canto XI. Of Boots.',
            'Canto XII. Of the Wedding, Which Shall Be Magnificent Whether or Not Anyone Comes.',
          ],
        },
        'Each canto runs to some forty lines, enclosed. Read them in order. Or at all.',
      ],
      signoff: 'Proclaimingly,',
      signature: 'Florian Augustin Peregrine Valoris, Crown Prince of Highroost, Defender of the Eastern Hills, Warden of the Ninth Bell Tower, &c.',
      postscript: [{ del: 'Please write back. Anything. One word.' }],
      pickup: {
        line: 'Lord Featherington of the Twelve Winds! Twelve cantos. If she will not answer, she shall at least be answered. Go!',
        name: 'Lord Featherington of the Twelve Winds',
      },
      arrive: 'Twelve cantos. Canto Ten: “Of the Sun, Who Is Completely Fine.” …He never got my question, did he.',
      sealLine: 'Broken seal. I hope you skipped to the end. There isn’t one.',
      lost: 'Twelve cantos fall like a small, well-bound avalanche.',
    },
  },

  6: {
    'just-maren': {
      title: 'Harvest Moon',
      from: 'princess', to: 'prince', pages: 1, weight: 'light',
      salutation: 'Florian.',
      body: [
        'One true thing back: I’m afraid of crowds, which is inconvenient for a princess.',
        'I balance the granary ledgers at night because numbers never pretend.',
        'I’ll see you at the Harvest Moon. Bring nothing heavy.',
      ],
      signature: '— Maren. (Just Maren.)',
      postscript: [{ del: 'Bring the trophy. I want to see it.' }],
      pickup: { line: 'Pigeon. Last one. Then you can rest.' },
      arrive: '“Just Maren.” …Pigeon. I think I’m going to marry someone I like.',
      arriveName: 'Pigeon',
      sealLine: 'You read it. Of course you did. You’ve read all of it, haven’t you, Pigeon. Good.',
      lost: 'Her last card blows away. She’ll have to say it out loud — which, as it turns out, she can.',
    },
    'finish-it': {
      title: 'Harvest Moon',
      from: 'princess', to: 'prince', pages: 1, weight: 'light',
      salutation: 'Florian.',
      body: [
        'You started to say something true, and then you rhymed your way out of it. I noticed.',
        'Finish it at the Harvest Moon. In person. No paper.',
      ],
      signature: '— M.',
      postscript: [{ del: 'I’m afraid of things too.' }],
      pickup: { line: 'Pigeon. Last one. Then you can rest.' },
      arrive: '“In person. No paper.” No paper! I shall have to say things out loud. With my face.',
      arriveName: 'Pigeon',
      lost: 'The card is gone. “No paper,” it said; the wind agreed.',
    },
    'after-dark': {
      title: 'Harvest Moon',
      from: 'princess', to: 'prince', pages: 1, weight: 'light',
      salutation: 'Florian —',
      body: [
        'Received, after dark.',
        'You began to say something, and then wrote four pages about truth instead of telling me one.',
        'See you at the Harvest Moon, as the treaty requires.',
      ],
      signature: '— M.',
      pickup: { line: 'Pigeon. Take it. Don’t hurry.' },
      arrive: '“As the treaty requires.” Yes. Well. The treaty is very clear.',
      arriveName: 'Archduke Wingsworth of the Final Post',
      lost: 'The card goes off into the night, which is where she said all of this anyway.',
    },
    'twelve-cantos': {
      title: 'Harvest Moon',
      from: 'princess', to: 'prince', pages: 1, weight: 'light',
      salutation: 'Florian —',
      body: [
        'Received. Twelve cantos.',
        'See you at the Harvest Moon, as the treaty requires.',
      ],
      signature: '— M.',
      postscript: [{ del: 'I asked you a question. You never got it, did you.' }],
      pickup: { line: 'Pigeon. That’s all I have to say.' },
      arrive: 'Twelve cantos, and she has written twelve words. Still — a wedding is a wedding. I shall wear the boots.',
      arriveName: 'Archduke Wingsworth of the Final Post',
      lost: 'Twelve words, lost. He would have counted them.',
    },
    'nothing-again': {
      title: 'Harvest Moon',
      from: 'princess', to: 'prince', pages: 1, weight: 'light',
      salutation: 'Florian —',
      body: ['Nothing again.', 'Fine. The treaty is the treaty.', 'Harvest Moon.'],
      signature: '— M.',
      pickup: { line: 'Pigeon. Go on.' },
      arrive: '“The treaty is the treaty.” Quite right. I shall have the bells polished.',
      arriveName: 'Archduke Wingsworth of the Final Post',
      lost: 'The last card is lost. Nobody is surprised any more.',
    },
  },
};

// Generic delivery lines, keyed by recipient and day. A variant's sealLine
// overrides `broken`; the prince's bark carries the day's grand name.
export const REACTIONS = {
  prince: {
    bark: (name) => (name === 'Pigeon' ? 'Ah — Pigeon. Thank you, Pigeon.' : `Ah! My winged herald! Today I name you ${name}.`),
    names: { 2: 'Gallant Cumulus, Herald of the West Wind', 4: 'Nimbus the Inevitable' },
    ontime: {
      2: 'Punctual! Like the dawn. Or like me.',
      4: 'Before sunset! The heavens themselves keep your schedule.',
      6: 'On time, on the very last day. I shall have a small medal struck. Or a large one.',
    },
    late: {
      2: 'After dark! I had begun composing an elegy for you. It was very good. I may send it anyway.',
      4: 'Night has fallen — and so, very nearly, had my hope. Never mind. You’re here.',
      6: 'Late, on the last night! My nerves, Pigeon. My nerves are not built for suspense.',
    },
    broken: 'The seal is broken! Someone was too moved to wait. I understand completely — I am often moved by her too.',
  },
  princess: {
    bark: () => 'Pigeon.',
    ontime: {
      1: 'On time. Good.',
      3: 'Before sunset. Good bird.',
      5: 'On time.',
    },
    late: {
      1: 'Late. It’s dark. Never mind — I was up anyway. Ledgers.',
      3: 'After dark again. The lamps are lit; I’ll read it here.',
      5: 'Late. I’d stopped looking at the window. …I hadn’t, actually.',
    },
    broken: 'Seal’s broken. Someone read this. Fine.',
  },
};

export const ENDINGS = {
  happy: {
    id: 'happy',
    title: 'Happily Ever After',
    lines: [
      'On the night of the Harvest Moon, on the hill halfway between Highroost and Westmere, a prince and a princess meet for the first time.',
      'He says, “Hello.” She says, “Hello.” It is the shortest conversation either of them has ever had, and the best.',
      'He writes her short letters now. She writes him slightly longer ones. Nobody counts the pages.',
      'The pigeon retires on a pension of crumbs, paid weekly, in person.',
    ],
    hint: 'There is another ending — less happy, and more common.',
  },
  unhappy: {
    id: 'unhappy',
    title: 'Ever After',
    subtitle: 'unhappily together',
    lines: [
      'On the night of the Harvest Moon the bells ring, the treaty is signed, and two strangers are married with great ceremony.',
      'He recites three cantos at the feast. She counts the guests: four hundred and twelve.',
      'They live in separate wings of a very large castle and are perfectly polite. They still write to each other — long letters one way, short ones the other.',
      'The pigeon still carries them, across a hallway now. It is the shortest route on the planet, and the loneliest.',
    ],
    hint: 'There is another ending. It starts with a question, answered in time.',
  },
};

export const EPILOGUE = {
  peeker: 'The pigeon knew everything before either of them did. It never told.',
  loser: 'Some letters never arrived. Somewhere on this planet, a shepherd knows more about this marriage than anyone.',
  punctual: 'Six letters, six sunsets, not one late. The Royal Post has never been so punctual.',
  lastLost: 'Her last card never arrived, so she said it to his face instead. It went better.',
  glutton: (n) => `You ate ${n} crumbs along the way. A pigeon has to keep its strength up.`,
};
