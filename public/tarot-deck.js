// Full 78-card Fairy Tarot Deck
// Traditional tarot structure with fairy-themed scenes

const SUIT_SCENES = {
    major:     { fairies:['🧚','🧚‍♀️'], elems:['✨','💫','🔮','⭐','🌟','🌙','👑','🪄','🦋','🌸'], glow:'#b496ff', ground:'#150a25' },
    wands:     { fairies:['🧚','🧚‍♀️'], elems:['🪄','🔥','🌿','🍂','🌲','🍃','🌺','🌻','✨','🌾'], glow:'#ff8040', ground:'#1a1808' },
    cups:      { fairies:['🧚‍♀️','🧚'], elems:['🍷','💧','🌊','🌸','💎','🐚','🪷','🫧','🌺','💜'], glow:'#60a0ff', ground:'#081828' },
    swords:    { fairies:['🧚','🧚‍♀️'], elems:['⚔️','☁️','💨','⚡','🕊️','🦅','🌪️','💎','🌙','✨'], glow:'#c0c0e0', ground:'#101520' },
    pentacles: { fairies:['🧚‍♀️','🧚'], elems:['⭐','🌿','💎','🍀','🌰','🌻','🍯','🌱','🌳','✨'], glow:'#c9a84c', ground:'#101a08' },
};

const FAIRY_DECK = [
    // ======== MAJOR ARCANA (22) ========
    {num:'0',name:'The Fool',keyword:'Beginnings',suit:'major',emoji:'🌿',meanings:{
        past:'A leap of faith you once took opened doors you never imagined.',
        present:'The universe is inviting you to begin something new. Trust and jump.',
        future:'A fresh start full of wonder and possibility is on its way.'}},
    {num:'I',name:'The Magician',keyword:'Manifestation',suit:'major',emoji:'🪄',meanings:{
        past:'You turned raw potential into something real through sheer willpower.',
        present:'Everything you need is already in your hands. Channel your focus.',
        future:'Your ability to create something from nothing will soon be tested and proven.'}},
    {num:'II',name:'The High Priestess',keyword:'Intuition',suit:'major',emoji:'🌙',meanings:{
        past:'A quiet knowing guided you when logic could not.',
        present:'The answers you seek are within. Be still and listen to your inner fairy.',
        future:'Hidden knowledge will reveal itself to you when the time is right.'}},
    {num:'III',name:'The Empress',keyword:'Abundance',suit:'major',emoji:'🌸',meanings:{
        past:'A season of growth and nurturing shaped the beauty around you.',
        present:'You are overflowing with creative energy. Let it bloom freely.',
        future:'Abundance in love, art, or nature is heading your way like spring.'}},
    {num:'IV',name:'The Emperor',keyword:'Structure',suit:'major',emoji:'👑',meanings:{
        past:'You built something solid and lasting through discipline and vision.',
        present:'Take charge of the situation. Your strength brings order to chaos.',
        future:'A role of authority or responsibility will soon be yours to claim.'}},
    {num:'V',name:'The Hierophant',keyword:'Wisdom',suit:'major',emoji:'📖',meanings:{
        past:'A mentor or tradition gave you a foundation you still stand on.',
        present:'Seek guidance from those who walked this path before you.',
        future:'A wise teacher or sacred lesson will appear when you need it most.'}},
    {num:'VI',name:'The Lovers',keyword:'Connection',suit:'major',emoji:'💕',meanings:{
        past:'A choice made from the heart defined the course of your story.',
        present:'Love and harmony are calling. Align your actions with your deepest values.',
        future:'A powerful bond or meaningful choice in love is drawing near.'}},
    {num:'VII',name:'The Chariot',keyword:'Willpower',suit:'major',emoji:'⚡',meanings:{
        past:'Your determination carried you through when everything tried to stop you.',
        present:'Seize control. You have the drive to overcome any obstacle right now.',
        future:'Victory through sheer willpower is closer than you think.'}},
    {num:'VIII',name:'Strength',keyword:'Courage',suit:'major',emoji:'🦁',meanings:{
        past:'Gentle courage tamed a situation that brute force never could.',
        present:'True strength lives in your compassion. Lead with a soft roar.',
        future:'An inner fire will rise in you, quiet but unbreakable.'}},
    {num:'IX',name:'The Hermit',keyword:'Solitude',suit:'major',emoji:'🏮',meanings:{
        past:'Time spent alone illuminated truths you couldn\'t see in the noise.',
        present:'Step back from the world for a moment. Your lantern glows brightest in silence.',
        future:'A period of reflection will bring the clarity you\'ve been searching for.'}},
    {num:'X',name:'Wheel of Fortune',keyword:'Cycles',suit:'major',emoji:'🎡',meanings:{
        past:'A twist of fate changed everything in ways you couldn\'t have predicted.',
        present:'The wheel is turning. Embrace the change — it\'s in your favor.',
        future:'A shift in fortune is approaching. What goes around is coming around beautifully.'}},
    {num:'XI',name:'Justice',keyword:'Truth',suit:'major',emoji:'⚖️',meanings:{
        past:'A fair outcome restored balance after a difficult chapter.',
        present:'The truth will set things right. Act with integrity and clarity.',
        future:'A just resolution is coming. The scales will tip in favor of what\'s right.'}},
    {num:'XII',name:'The Hanged Man',keyword:'Surrender',suit:'major',emoji:'🍃',meanings:{
        past:'Letting go of control revealed a perspective that changed everything.',
        present:'Pause. Surrender the need to push. Wisdom comes from hanging still.',
        future:'A willing sacrifice or shift in perspective will unlock something profound.'}},
    {num:'XIII',name:'Death',keyword:'Transformation',suit:'major',emoji:'🦋',meanings:{
        past:'An ending you feared turned out to be the most beautiful beginning.',
        present:'Something is ending so something greater can be born. Let the old fall away.',
        future:'A powerful transformation is approaching — not an end, but a metamorphosis.'}},
    {num:'XIV',name:'Temperance',keyword:'Balance',suit:'major',emoji:'💧',meanings:{
        past:'Finding the middle path brought peace after a time of extremes.',
        present:'Blend patience with passion. Harmony is your greatest spell right now.',
        future:'A perfect balance of forces will create something alchemical in your life.'}},
    {num:'XV',name:'The Devil',keyword:'Shadow',suit:'major',emoji:'⛓️',meanings:{
        past:'An attachment or pattern held you in a gilded cage for too long.',
        present:'Look honestly at what binds you. The chains are looser than they seem.',
        future:'Confronting a shadow will free you in ways that feel like flying.'}},
    {num:'XVI',name:'The Tower',keyword:'Upheaval',suit:'major',emoji:'⚡',meanings:{
        past:'A sudden collapse cleared the ground for something far more real.',
        present:'Things are shaking. Let the false structures fall — the truth survives.',
        future:'A sudden revelation will crack everything open, but light pours through the cracks.'}},
    {num:'XVII',name:'The Star',keyword:'Hope',suit:'major',emoji:'⭐',meanings:{
        past:'After the storm, a quiet hope carried you toward healing.',
        present:'You are being renewed. Pour your wishes into the universe — it\'s listening.',
        future:'A season of deep hope and inspiration is almost here.'}},
    {num:'XVIII',name:'The Moon',keyword:'Illusion',suit:'major',emoji:'🌙',meanings:{
        past:'Things were not as they seemed, and the truth hid behind moonlit shadows.',
        present:'Trust your instincts over appearances. Not everything in the dark is a threat.',
        future:'A fog will lift, revealing what was hidden beneath the surface all along.'}},
    {num:'XIX',name:'The Sun',keyword:'Joy',suit:'major',emoji:'☀️',meanings:{
        past:'A golden moment of pure happiness left a warmth you still carry.',
        present:'Everything is glowing. Step into the light and let joy fill you completely.',
        future:'Radiant success and happiness are shining just over the horizon.'}},
    {num:'XX',name:'Judgement',keyword:'Rebirth',suit:'major',emoji:'🔔',meanings:{
        past:'A moment of reckoning freed you from the weight of the past.',
        present:'Answer the call rising within you. It\'s time to become who you\'re meant to be.',
        future:'A profound awakening will invite you to rise, renewed and whole.'}},
    {num:'XXI',name:'The World',keyword:'Completion',suit:'major',emoji:'🌍',meanings:{
        past:'A grand cycle completed, and you emerged whole and accomplished.',
        present:'Everything is coming together. You are exactly where you need to be.',
        future:'A beautiful chapter is reaching its fulfillment — and a new one waits beyond.'}},

    // ======== WANDS (14) — Fire / Creativity / Will ========
    {num:'ACE',name:'Ace of Wands',keyword:'Spark',suit:'wands',emoji:'🪄',meanings:{
        past:'A sudden burst of inspiration set a creative journey into motion.',
        present:'A new spark of passion is igniting inside you. Follow it.',
        future:'A brilliant new idea or opportunity is about to land in your lap.'}},
    {num:'II',name:'Two of Wands',keyword:'Vision',suit:'wands',emoji:'🪄',meanings:{
        past:'You stood at a crossroads and chose the bolder path.',
        present:'The world is yours to explore. Plan your next move with confidence.',
        future:'A decision between comfort and adventure will define your next chapter.'}},
    {num:'III',name:'Three of Wands',keyword:'Expansion',suit:'wands',emoji:'🪄',meanings:{
        past:'Seeds you planted began to grow beyond what you first imagined.',
        present:'Your efforts are gaining momentum. Look toward the wider horizon.',
        future:'Expansion and progress are heading your way from unexpected directions.'}},
    {num:'IV',name:'Four of Wands',keyword:'Celebration',suit:'wands',emoji:'🪄',meanings:{
        past:'A moment of harmony and celebration brought people together joyfully.',
        present:'Take time to honor how far you\'ve come. You\'ve earned this warmth.',
        future:'A gathering, milestone, or homecoming will fill your heart with light.'}},
    {num:'V',name:'Five of Wands',keyword:'Conflict',suit:'wands',emoji:'🪄',meanings:{
        past:'A clash of ideas or wills pushed you to sharpen your own voice.',
        present:'Tension is creative fuel right now. Don\'t avoid the friction — grow from it.',
        future:'A competitive challenge will test you, but you\'ll rise stronger.'}},
    {num:'VI',name:'Six of Wands',keyword:'Victory',suit:'wands',emoji:'🪄',meanings:{
        past:'You earned recognition and praise for something you worked hard on.',
        present:'Success is here. Accept the applause — your light deserves to be seen.',
        future:'Public recognition or a personal triumph is just around the corner.'}},
    {num:'VII',name:'Seven of Wands',keyword:'Defense',suit:'wands',emoji:'🪄',meanings:{
        past:'You held your ground when others tried to push you aside.',
        present:'Stand firm in what you believe. You have the high ground.',
        future:'You\'ll need to defend your position, but your courage will win the day.'}},
    {num:'VIII',name:'Eight of Wands',keyword:'Momentum',suit:'wands',emoji:'🪄',meanings:{
        past:'Things moved quickly and suddenly everything fell into place.',
        present:'Swift action is needed now. The energy is rushing forward — ride it.',
        future:'Events will accelerate rapidly. Be ready to move when the signal comes.'}},
    {num:'IX',name:'Nine of Wands',keyword:'Resilience',suit:'wands',emoji:'🪄',meanings:{
        past:'You pushed through exhaustion and found reserves of strength you didn\'t know you had.',
        present:'You\'re weary but almost there. One last push and the finish line is yours.',
        future:'A test of endurance awaits, but you will not break.'}},
    {num:'X',name:'Ten of Wands',keyword:'Burden',suit:'wands',emoji:'🪄',meanings:{
        past:'You carried too much for too long and it taught you about your limits.',
        present:'Put down what isn\'t yours to carry. Delegate, release, breathe.',
        future:'A heavy load will reach its tipping point — and then lighten beautifully.'}},
    {num:'PAGE',name:'Page of Wands',keyword:'Discovery',suit:'wands',emoji:'📜',meanings:{
        past:'A spark of curiosity led you down a path that changed everything.',
        present:'Explore freely with the wonder of a young fairy. Every idea is worth chasing.',
        future:'An exciting message or new creative venture is about to arrive.'}},
    {num:'KNIGHT',name:'Knight of Wands',keyword:'Passion',suit:'wands',emoji:'🦄',meanings:{
        past:'Fearless enthusiasm carried you into an adventure headfirst.',
        present:'Charge forward with confidence. Your fiery energy is unstoppable right now.',
        future:'A passionate pursuit or daring opportunity is galloping toward you.'}},
    {num:'QUEEN',name:'Queen of Wands',keyword:'Confidence',suit:'wands',emoji:'👸',meanings:{
        past:'You led with warmth and magnetism, drawing others into your light.',
        present:'Own your power. Your charisma and creativity are at their peak.',
        future:'A role that lets your inner fire shine will open up for you.'}},
    {num:'KING',name:'King of Wands',keyword:'Leadership',suit:'wands',emoji:'👑',meanings:{
        past:'Visionary leadership turned a bold idea into something real.',
        present:'Lead with inspiration, not control. Your vision rallies others naturally.',
        future:'A position of creative authority awaits — one that matches your ambition.'}},

    // ======== CUPS (14) — Water / Emotions / Love ========
    {num:'ACE',name:'Ace of Cups',keyword:'Love',suit:'cups',emoji:'🍷',meanings:{
        past:'A flood of new emotion — love, joy, or inspiration — changed your world.',
        present:'Your heart is overflowing. Open it wider and let the magic pour in.',
        future:'A beautiful new emotional beginning is on its way to you.'}},
    {num:'II',name:'Two of Cups',keyword:'Partnership',suit:'cups',emoji:'🍷',meanings:{
        past:'A deep bond formed that balanced and completed something in you.',
        present:'A meaningful connection is blossoming. Meet it with openness and trust.',
        future:'A partnership of equals — romantic or otherwise — is drawing close.'}},
    {num:'III',name:'Three of Cups',keyword:'Friendship',suit:'cups',emoji:'🍷',meanings:{
        past:'A celebration with loved ones created memories that still sparkle.',
        present:'Gather your people. Joy multiplies when shared with kindred spirits.',
        future:'A joyful reunion or celebration with friends is in the stars.'}},
    {num:'IV',name:'Four of Cups',keyword:'Contemplation',suit:'cups',emoji:'🍷',meanings:{
        past:'Boredom or discontent pushed you to look inward for what was missing.',
        present:'Look up — an opportunity is being offered that you might be overlooking.',
        future:'A period of reflection will reveal a gift hiding in plain sight.'}},
    {num:'V',name:'Five of Cups',keyword:'Grief',suit:'cups',emoji:'🍷',meanings:{
        past:'A loss or disappointment taught you about what truly matters.',
        present:'Honor the sadness, but turn around — two full cups still stand behind you.',
        future:'After a moment of sorrow, you\'ll discover what remains is more than enough.'}},
    {num:'VI',name:'Six of Cups',keyword:'Nostalgia',suit:'cups',emoji:'🍷',meanings:{
        past:'Sweet memories of simpler times shaped the tenderness in your heart.',
        present:'Revisit something from your past. Innocence still has gifts to offer.',
        future:'A person or memory from your past will reappear with gentle magic.'}},
    {num:'VII',name:'Seven of Cups',keyword:'Fantasy',suit:'cups',emoji:'🍷',meanings:{
        past:'Beautiful daydreams distracted you from choosing a real path.',
        present:'So many options shimmer before you — but only one is real. Choose wisely.',
        future:'You\'ll face a dazzling array of choices. Look past the glitter to find truth.'}},
    {num:'VIII',name:'Eight of Cups',keyword:'Departure',suit:'cups',emoji:'🍷',meanings:{
        past:'Walking away from something comfortable led you to something meaningful.',
        present:'It\'s time to move on. What you\'re leaving behind has already given its gifts.',
        future:'A brave departure will lead you toward deeper emotional fulfillment.'}},
    {num:'IX',name:'Nine of Cups',keyword:'Wishes',suit:'cups',emoji:'🍷',meanings:{
        past:'A wish you held close to your heart came true in the most beautiful way.',
        present:'Contentment glows around you. This is the moment you wished for.',
        future:'Your deepest wish is closer to coming true than you realize.'}},
    {num:'X',name:'Ten of Cups',keyword:'Harmony',suit:'cups',emoji:'🍷',meanings:{
        past:'A moment of complete emotional fulfillment left a lasting rainbow in your heart.',
        present:'Love surrounds you. Family, friends, community — this is your fairy tale.',
        future:'Lasting happiness and emotional wholeness are blooming ahead.'}},
    {num:'PAGE',name:'Page of Cups',keyword:'Imagination',suit:'cups',emoji:'📜',meanings:{
        past:'A moment of creative wonder or an unexpected feeling opened new doors.',
        present:'Let your imagination run wild. A sweet surprise wants to find you.',
        future:'An unexpected emotional message or creative inspiration is coming.'}},
    {num:'KNIGHT',name:'Knight of Cups',keyword:'Romance',suit:'cups',emoji:'🦄',meanings:{
        past:'A romantic gesture or heartfelt pursuit swept you off your feet.',
        present:'Follow your heart fearlessly. A beautiful quest is calling you.',
        future:'A charming offer or romantic opportunity is riding toward you.'}},
    {num:'QUEEN',name:'Queen of Cups',keyword:'Compassion',suit:'cups',emoji:'👸',meanings:{
        past:'Your empathy and emotional wisdom healed someone — maybe yourself.',
        present:'Trust your emotional depths. Your intuition is a wellspring of power.',
        future:'Your compassionate nature will be your greatest strength in what\'s ahead.'}},
    {num:'KING',name:'King of Cups',keyword:'Mastery',suit:'cups',emoji:'👑',meanings:{
        past:'Balancing deep emotion with calm wisdom earned you quiet respect.',
        present:'Lead with your heart but let wisdom steer. Emotional maturity is your crown.',
        future:'A role requiring emotional intelligence and diplomacy is heading your way.'}},

    // ======== SWORDS (14) — Air / Intellect / Truth ========
    {num:'ACE',name:'Ace of Swords',keyword:'Clarity',suit:'swords',emoji:'⚔️',meanings:{
        past:'A moment of piercing clarity cut through confusion and set you free.',
        present:'A breakthrough idea or truth is crystallizing. Seize it with both hands.',
        future:'A flash of mental clarity will slice through the fog and reveal the way.'}},
    {num:'II',name:'Two of Swords',keyword:'Indecision',suit:'swords',emoji:'⚔️',meanings:{
        past:'An impossible choice left you frozen between two paths.',
        present:'You can\'t avoid this decision forever. Remove the blindfold and choose.',
        future:'A stalemate will break when you finally trust yourself to pick a side.'}},
    {num:'III',name:'Three of Swords',keyword:'Heartbreak',suit:'swords',emoji:'⚔️',meanings:{
        past:'A painful truth pierced your heart but ultimately made it stronger.',
        present:'Let yourself feel the hurt. Healing begins the moment you stop hiding from it.',
        future:'A difficult truth will sting, but it will also set something important free.'}},
    {num:'IV',name:'Four of Swords',keyword:'Rest',suit:'swords',emoji:'⚔️',meanings:{
        past:'A period of rest and retreat restored you after a difficult battle.',
        present:'Lay down your sword. Rest is not weakness — it\'s strategy.',
        future:'A needed pause will come, giving you time to heal and recharge.'}},
    {num:'V',name:'Five of Swords',keyword:'Defeat',suit:'swords',emoji:'⚔️',meanings:{
        past:'A conflict left everyone wounded, win or lose.',
        present:'Not every battle is worth fighting. Know when to walk away with grace.',
        future:'A conflict ahead isn\'t worth the cost. Choose peace over pride.'}},
    {num:'VI',name:'Six of Swords',keyword:'Transition',suit:'swords',emoji:'⚔️',meanings:{
        past:'Leaving a painful situation behind carried you to calmer waters.',
        present:'You\'re moving toward better things. The journey is quiet but necessary.',
        future:'A gentle transition away from turbulence will bring you to peaceful shores.'}},
    {num:'VII',name:'Seven of Swords',keyword:'Strategy',suit:'swords',emoji:'⚔️',meanings:{
        past:'A clever move — or a deception — changed the game in unexpected ways.',
        present:'Be strategic, but be honest. Shortcuts that cut corners cut trust too.',
        future:'Watch for hidden motives — in others or in yourself.'}},
    {num:'VIII',name:'Eight of Swords',keyword:'Restriction',suit:'swords',emoji:'⚔️',meanings:{
        past:'You felt trapped, but the prison was built from your own thoughts.',
        present:'The barriers around you are illusions. Open your eyes and step forward.',
        future:'A feeling of being stuck will dissolve once you realize you hold the key.'}},
    {num:'IX',name:'Nine of Swords',keyword:'Anxiety',suit:'swords',emoji:'⚔️',meanings:{
        past:'Worry and fear kept you awake, magnifying problems in the dark.',
        present:'The nightmares are worse than reality. Speak your fears aloud — they shrink in daylight.',
        future:'A wave of anxiety will pass. What you dread is not as powerful as you are.'}},
    {num:'X',name:'Ten of Swords',keyword:'Ending',suit:'swords',emoji:'⚔️',meanings:{
        past:'A painful ending brought you to rock bottom — and then to rebirth.',
        present:'This is the lowest point, which means the only way is up. Dawn is breaking.',
        future:'A chapter will end dramatically, but the sunrise that follows will be breathtaking.'}},
    {num:'PAGE',name:'Page of Swords',keyword:'Curiosity',suit:'swords',emoji:'📜',meanings:{
        past:'A sharp question or bold observation opened your mind to new possibilities.',
        present:'Stay alert and curious. Information is power right now.',
        future:'News or a clever idea will arrive that changes your thinking completely.'}},
    {num:'KNIGHT',name:'Knight of Swords',keyword:'Action',suit:'swords',emoji:'🦄',meanings:{
        past:'Swift, decisive action cut through obstacles when hesitation would have failed.',
        present:'Move quickly and decisively. The time for thinking is over — act now.',
        future:'A fast-moving situation will demand quick thinking and bold moves.'}},
    {num:'QUEEN',name:'Queen of Swords',keyword:'Perception',suit:'swords',emoji:'👸',meanings:{
        past:'Clear-eyed honesty and sharp perception protected you from illusion.',
        present:'See things as they are, not as you wish they were. Truth is your ally.',
        future:'Your ability to perceive the truth will be your greatest asset soon.'}},
    {num:'KING',name:'King of Swords',keyword:'Authority',suit:'swords',emoji:'👑',meanings:{
        past:'Intellectual authority and fair judgment earned lasting respect.',
        present:'Lead with your mind. Clear communication and logic are your scepter.',
        future:'A role requiring sharp judgment and honest authority is meant for you.'}},

    // ======== PENTACLES (14) — Earth / Material / Growth ========
    {num:'ACE',name:'Ace of Pentacles',keyword:'Opportunity',suit:'pentacles',emoji:'⭐',meanings:{
        past:'A golden opportunity appeared and you had the wisdom to take it.',
        present:'A door to abundance is opening. Plant your feet and walk through it.',
        future:'A material or financial opportunity is heading straight for you.'}},
    {num:'II',name:'Two of Pentacles',keyword:'Balance',suit:'pentacles',emoji:'⭐',meanings:{
        past:'Juggling competing priorities taught you flexibility and grace.',
        present:'Keep dancing between your responsibilities. You\'re handling it better than you think.',
        future:'A balancing act lies ahead — stay nimble and you\'ll manage beautifully.'}},
    {num:'III',name:'Three of Pentacles',keyword:'Teamwork',suit:'pentacles',emoji:'⭐',meanings:{
        past:'Collaboration with skilled people created something none of you could alone.',
        present:'Your craft shines brightest when combined with others. Seek collaboration.',
        future:'A team effort or creative partnership will produce something masterful.'}},
    {num:'IV',name:'Four of Pentacles',keyword:'Security',suit:'pentacles',emoji:'⭐',meanings:{
        past:'Holding tightly to what you had gave you stability but also rigidity.',
        present:'Security matters, but don\'t grip so tight you can\'t receive. Loosen your hold.',
        future:'A choice between security and generosity will reveal what you truly value.'}},
    {num:'V',name:'Five of Pentacles',keyword:'Hardship',suit:'pentacles',emoji:'⭐',meanings:{
        past:'A time of lack or struggle taught you who truly shows up for you.',
        present:'You are not as alone as you feel. Help is closer than you think — ask.',
        future:'A rough patch will pass, and you\'ll emerge knowing your own resilience.'}},
    {num:'VI',name:'Six of Pentacles',keyword:'Generosity',suit:'pentacles',emoji:'⭐',meanings:{
        past:'Giving or receiving generosity created a ripple of goodness.',
        present:'Share what you have. The flow of giving and receiving is magical right now.',
        future:'An act of generosity — given or received — will shift your circumstances.'}},
    {num:'VII',name:'Seven of Pentacles',keyword:'Patience',suit:'pentacles',emoji:'⭐',meanings:{
        past:'Patient waiting and tending produced a harvest worth the effort.',
        present:'Your work is growing beneath the surface. Trust the process and keep tending.',
        future:'The fruits of your labor will appear — they just need a little more time.'}},
    {num:'VIII',name:'Eight of Pentacles',keyword:'Craft',suit:'pentacles',emoji:'⭐',meanings:{
        past:'Dedicated practice and attention to detail made you a master of your craft.',
        present:'Dive deep into your work. Every detail matters and every effort compounds.',
        future:'Diligent effort will level up your skills in ways that open new doors.'}},
    {num:'IX',name:'Nine of Pentacles',keyword:'Luxury',suit:'pentacles',emoji:'⭐',meanings:{
        past:'You built a life of comfort and beauty through your own hard work.',
        present:'Enjoy the abundance around you. You earned this garden — walk through it.',
        future:'A period of material comfort and personal fulfillment is blossoming ahead.'}},
    {num:'X',name:'Ten of Pentacles',keyword:'Legacy',suit:'pentacles',emoji:'⭐',meanings:{
        past:'Something you built created lasting value that touched more than just yourself.',
        present:'Think beyond today. What you\'re building now will echo for generations.',
        future:'Lasting wealth, family harmony, or a legacy of love is taking shape.'}},
    {num:'PAGE',name:'Page of Pentacles',keyword:'Ambition',suit:'pentacles',emoji:'📜',meanings:{
        past:'A dream of building something real ignited a practical journey.',
        present:'Study, plan, and learn. A solid foundation starts with a curious mind.',
        future:'An exciting opportunity to learn or invest in your future is coming.'}},
    {num:'KNIGHT',name:'Knight of Pentacles',keyword:'Dedication',suit:'pentacles',emoji:'🦄',meanings:{
        past:'Steady, reliable effort moved mountains one stone at a time.',
        present:'Stay the course. Slow and steady is your magic right now.',
        future:'Patient persistence will deliver results that flashy shortcuts never could.'}},
    {num:'QUEEN',name:'Queen of Pentacles',keyword:'Nurturing',suit:'pentacles',emoji:'👸',meanings:{
        past:'Your practical care and warmth made the world feel safe for those around you.',
        present:'Tend to your garden — both literally and figuratively. Your touch makes things grow.',
        future:'A role of nurturing abundance and practical magic awaits you.'}},
    {num:'KING',name:'King of Pentacles',keyword:'Prosperity',suit:'pentacles',emoji:'👑',meanings:{
        past:'Wise stewardship turned effort into lasting prosperity.',
        present:'You are the embodiment of grounded success. Share your stability generously.',
        future:'Material mastery and grounded authority are yours to claim.'}},
];
