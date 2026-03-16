import unittest

from app.services.inference import select_model_language
from app.utils.translations import translate_sign


class TestLanguageSelection(unittest.TestCase):
    def test_select_model_language_normalizes_input(self):
        requested, used = select_model_language(' fsl ', {'ASL', 'FSL'})
        self.assertEqual(requested, 'FSL')
        self.assertEqual(used, 'FSL')

    def test_select_model_language_falls_back_to_asl(self):
        requested, used = select_model_language('FSL', {'ASL'})
        self.assertEqual(requested, 'FSL')
        self.assertEqual(used, 'ASL')

    def test_select_model_language_unknown_defaults_to_asl(self):
        requested, used = select_model_language('whatever', {'ASL'})
        self.assertEqual(requested, 'ASL')
        self.assertEqual(used, 'ASL')

    def test_translate_sign_uses_requested_language_when_available(self):
        self.assertEqual(translate_sign('SALAMAT', 'FSL', 'English'), 'Thank you')

    def test_translate_sign_falls_back_across_label_sets(self):
        self.assertEqual(translate_sign('THANK_YOU', 'FSL', 'Tagalog'), 'Salamat')
        self.assertEqual(translate_sign('SALAMAT', 'ASL', 'English'), 'Thank you')


if __name__ == '__main__':
    unittest.main()

