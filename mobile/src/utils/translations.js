// Lookup table for 10 signs across FSL and ASL
export const TRANSLATIONS = {
  FSL: {
    KAMUSTA: {
      Tagalog: 'Kamusta!',
      English: 'Hello!'
    },
    SALAMAT: {
      Tagalog: 'Salamat!',
      English: 'Thank you!'
    },
    TULONG: {
      Tagalog: 'Kailangan ko ng tulong',
      English: 'I need help'
    },
    OO: {
      Tagalog: 'Oo',
      English: 'Yes'
    },
    HINDI: {
      Tagalog: 'Hindi',
      English: 'No'
    }
  },
  ASL: {
    HELLO: {
      English: 'Hello!',
      Tagalog: 'Kamusta!'
    },
    THANK_YOU: {
      English: 'Thank you!',
      Tagalog: 'Salamat!'
    },
    HELP: {
      English: 'I need help',
      Tagalog: 'Kailangan ko ng tulong'
    },
    YES: {
      English: 'Yes',
      Tagalog: 'Oo'
    },
    NO: {
      English: 'No',
      Tagalog: 'Hindi'
    }
  }
};

export const getTranslation = (signLanguage, sign, outputLanguage) => {
  return TRANSLATIONS[signLanguage]?.[sign]?.[outputLanguage] || '';
};
