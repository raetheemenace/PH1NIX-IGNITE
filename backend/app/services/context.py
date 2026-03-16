from app.utils.translations import AMBIGUOUS_SIGNS, translate_sign

def apply_context_awareness(sign, recent_signs, sign_language, output_language):
    """
    Apply context awareness to resolve ambiguous signs
    """
    # Check if sign is ambiguous
    if sign in AMBIGUOUS_SIGNS:
        # Analyze recent signs for context
        for option in AMBIGUOUS_SIGNS[sign]:
            if any(context_sign in recent_signs for context_sign in option['context']):
                sign = option['meaning']
                break
    
    return translate_sign(sign, sign_language, output_language)
