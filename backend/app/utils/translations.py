# Translation mappings for ASL and FSL signs

TRANSLATIONS = {
    'ASL': {
        'HOW_ARE_YOU': {
            'English': 'How are you?',
            'Tagalog': 'Kumusta ka?'
        },
        'THANK_YOU': {
            'English': 'Thank you',
            'Tagalog': 'Salamat'
        },
        'HELP': {
            'English': 'Help',
            'Tagalog': 'Tulong'
        },
        'YES': {
            'English': 'Yes',
            'Tagalog': 'Oo'
        },
        'NO': {
            'English': 'No',
            'Tagalog': 'Hindi'
        }
    },
    'FSL': {
        'KAMUSTA': {
            'English': 'How are you?',
            'Tagalog': 'Kumusta ka?'
        },
        'SALAMAT': {
            'English': 'Thank you',
            'Tagalog': 'Salamat'
        },
        'TULONG': {
            'English': 'Help',
            'Tagalog': 'Tulong'
        },
        'OO': {
            'English': 'Yes',
            'Tagalog': 'Oo'
        },
        'HINDI': {
            'English': 'No',
            'Tagalog': 'Hindi'
        }
    }
}


def translate_sign(sign: str, sign_language: str, output_language: str) -> str:
    requested_lang = (sign_language or '').strip().upper()
    requested_out = (output_language or '').strip()

    if requested_lang in TRANSLATIONS:
        translation = TRANSLATIONS[requested_lang].get(sign, {}).get(requested_out, '')
        if translation:
            return translation

    for fallback_lang in ('ASL', 'FSL'):
        translation = TRANSLATIONS.get(fallback_lang, {}).get(sign, {}).get(requested_out, '')
        if translation:
            return translation

    return ''

# Signs that can be ambiguous based on context
AMBIGUOUS_SIGNS = {
    # Example: A sign that could mean different things
    # 'SIGN_NAME': [
    #     {'context': ['PREVIOUS_SIGN'], 'meaning': 'MEANING_1'},
    #     {'context': ['OTHER_SIGN'], 'meaning': 'MEANING_2'}
    # ]
}
