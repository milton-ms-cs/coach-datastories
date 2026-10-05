"""
mlms.py - Machine Learning for Middle Schoolers

A simple library for training chatbots and building recommender systems.

"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import numpy as np


class TextClassifier:
    """
    Train a chatbot to classify questions into categories.

    This class uses machine learning to figure out what category a question
    belongs to. For example, if you're building a chatbot about dolphins,
    you might have categories like "habitat", "food", "behavior", etc.

    The ML algorithm learns patterns in your example questions, then uses
    those patterns to classify new questions it hasn't seen before!

    Example:
        >>> bot = TextClassifier()
        >>> training_data = {
        ...     "habitat": ["where do they live?", "what's their home?"],
        ...     "food": ["what do they eat?", "what's their diet?"]
        ... }
        >>> bot.train(training_data)
        >>> category, confidence = bot.classify("what do they like to eat?")
        >>> print(category)  # Will probably say "food"!
    """

    def __init__(self):
        """Create a new TextClassifier (not trained yet)."""
        self._vectorizer = None  # Converts text to numbers
        self._classifier = None  # The actual AI model
        self._categories = []    # List of category names
        self._is_trained = False # Have we trained yet?

    def train(self, training_data):
        """
        Train the classifier with example questions.

        This is where the learning happens! You provide examples of questions
        for each category, and the AI figures out the patterns.

        Args:
            training_data (dict): Dictionary mapping category names to lists of
                example questions.

                Example:
                {
                    "habitat": ["where do they live?", "what's their home?"],
                    "food": ["what do they eat?", "what's their diet?"],
                    "behavior": ["how do they act?", "what do they do?"]
                }

        Raises:
            ValueError: If training_data is empty or invalid
        """
        # Error checking - make sure the data makes sense!
        if not training_data:
            raise ValueError(
                "❌ Oops! Your training_data dictionary is empty.\n"
                "You need to provide at least one category with example questions.\n"
                "Example: {'habitat': ['where do they live?', 'what is their home?']}"
            )

        if not isinstance(training_data, dict):
            raise ValueError(
                "❌ Training data should be a dictionary!\n"
                "Example: {'category1': ['question1', 'question2'], 'category2': [...]}"
            )

        # Check that each category has questions
        for category, questions in training_data.items():
            if not questions:
                raise ValueError(
                    f"❌ Category '{category}' has no example questions!\n"
                    f"Add at least 2-3 example questions for this category."
                )
            if len(questions) < 2:
                print(
                    f"⚠️  Warning: Category '{category}' only has {len(questions)} example(s).\n"
                    f"   The AI works better with at least 3-5 examples per category!"
                )

        # Prepare the data for machine learning
        # We need two lists: one with all the questions, one with their categories
        all_questions = []
        all_labels = []

        for category, questions in training_data.items():
            for question in questions:
                all_questions.append(question.lower())  # Lowercase makes matching easier
                all_labels.append(category)

        self._categories = list(training_data.keys())

        # STEP 1: Convert text to numbers
        # Computers can't understand words, only numbers! This step converts
        # each question into a list of numbers representing the important words.
        # It uses something called "TF-IDF" which figures out which words are
        # most important for telling categories apart.
        self._vectorizer = TfidfVectorizer(
            lowercase=True,           # Treat "Where" and "where" the same
            stop_words='english',     # Ignore common words like "the", "a", "is"
            max_features=1000         # Only keep the 1000 most useful words
        )

        # Transform our questions into numbers
        question_vectors = self._vectorizer.fit_transform(all_questions)

        # STEP 2: Train the classifier
        # Now we use an AI algorithm called "Naive Bayes" which is really good
        # at text classification. It looks at which words appear most often in
        # each category and learns the patterns.
        self._classifier = MultinomialNB()
        self._classifier.fit(question_vectors, all_labels)

        self._is_trained = True

        print(f"✅ Training complete! Your chatbot learned {len(self._categories)} categories.")
        print(f"   Categories: {', '.join(self._categories)}")

    def classify(self, question):
        """
        Classify a question into a category.

        This is where the magic happens! The AI looks at your question and
        figures out which category it probably belongs to.

        Args:
            question (str): The question to classify

        Returns:
            tuple: (category_name, confidence_score)
                - category_name: Which category the AI thinks this is
                - confidence_score: How confident it is (0.0 to 1.0)
                  Higher = more confident. Below 0.3 = probably confused!

                Example: ("habitat", 0.85) means 85% confident it's about habitat

        Raises:
            RuntimeError: If you haven't called train() yet
        """
        # Make sure they trained the model first!
        if not self._is_trained:
            raise RuntimeError(
                "❌ You need to train the classifier first!\n"
                "Call bot.train(training_data) before trying to classify questions.\n"
                "Example:\n"
                "  bot = TextClassifier()\n"
                "  bot.train({'category1': ['question1', 'question2'], ...})\n"
                "  category, confidence = bot.classify('your question')"
            )

        if not question or not question.strip():
            raise ValueError("❌ Question cannot be empty!")

        # Convert the question to the same number format we used in training
        question_vector = self._vectorizer.transform([question.lower()])

        # Get the prediction
        predicted_category = self._classifier.predict(question_vector)[0]

        # Get the confidence scores for ALL categories
        # The classifier gives us a probability for each possible category
        probabilities = self._classifier.predict_proba(question_vector)[0]

        # Find the confidence for our predicted category
        category_index = list(self._classifier.classes_).index(predicted_category)
        confidence = probabilities[category_index]

        return predicted_category, confidence

    def get_categories(self):
        """
        Get the list of categories this classifier knows about.

        Returns:
            list: List of category names, or empty list if not trained yet
        """
        return self._categories.copy()  # Return a copy so they can't accidentally modify it

    def get_info(self):
        """
        Get information about this classifier.

        Returns:
            dict: Information about the classifier's state
        """
        return {
            'is_trained': self._is_trained,
            'num_categories': len(self._categories),
            'categories': self._categories
        }

class TextRecommender:
    """
    A simple, topic-agnostic recommender system.

    Students provide:
      - a dictionary of items
      - each item has numeric attributes (0, 1, 2, ...)

    The recommender learns a user's preferences based on their ratings.
    If a user rates spicy foods highly, their "spicy" preference grows.
    If they rate sweet foods low, their "sweet" preference stays low.

    To use:

        rec = TextRecommender()
        rec.set_items({
            "tacos": {"spicy": 2, "sweet": 0},
            "smoothie": {"spicy": 0, "sweet": 2}
        })

        rec.add_rating("alice", "tacos", 5)
        rec.add_rating("alice", "smoothie", 2)

        print(rec.recommend("alice"))

    This works for food, books, movies, makeup, pets, anything with attributes.
    """

    def __init__(self):
        self._items = {}          # {item_name: {attr: value}}
        self._ratings = {}        # {user: {item: rating}}
        self._preferences = {}    # {user: {attr: float}}
        self._learning_rate = 0.1 # How fast preferences change

    def set_items(self, items):
        """
        Add items and their attributes.

        Args:
            items (dict): Example:
                {
                    "tacos": {"spicy": 2, "sweet": 0},
                    "smoothie": {"spicy": 0, "sweet": 2}
                }

        Raises:
            ValueError: if items are missing or attribute sets don't match
        """
        if not items:
            raise ValueError("❌ set_items() needs at least one item.")

        # Validate that all items share the same attributes
        attr_sets = [set(attrs.keys()) for attrs in items.values()]
        first = attr_sets[0]
        for i, attrs in enumerate(attr_sets):
            if attrs != first:
                raise ValueError(
                    "❌ All items must have the same attributes.\n"
                    f"Item {i} has attributes {attrs}, expected {first}."
                )

        self._items = items

    def add_rating(self, user, item, rating):
        """
        Add a rating from 1–5 for a given item.
        Automatically updates the user's preference profile.

        Args:
            user (str)
            item (str)
            rating (int)

        Raises:
            ValueError: invalid rating or unknown item
        """
        if item not in self._items:
            raise ValueError(f"❌ Unknown item '{item}'. Did you call set_items()?")

        if not 1 <= rating <= 5:
            raise ValueError("❌ Rating must be between 1 and 5.")

        # Store the rating
        if user not in self._ratings:
            self._ratings[user] = {}
        self._ratings[user][item] = rating

        # Update user preferences
        self._update_preferences(user, item, rating)

    def _update_preferences(self, user, item, rating):
        """
        Move the user's preference profile slightly toward
        the attributes of the newly rated item.

        Higher ratings move preferences more.
        """
        item_attrs = self._items[item]

        # Initialize preferences if needed
        if user not in self._preferences:
            # Start with neutral preferences (middle of each attribute range)
            self._preferences[user] = {
                attr: float(value) for attr, value in item_attrs.items()
            }

        # Update each attribute using a simple weighted average move
        for attr, item_value in item_attrs.items():
            old_pref = self._preferences[user][attr]

            # Rating multiplier: higher ratings move the preference more
            strength = (rating - 3) / 2  # gives -1, -0.5, 0, 0.5, 1

            # Move preference slightly toward the item's attribute value
            new_pref = old_pref + self._learning_rate * strength * (item_value - old_pref)
            self._preferences[user][attr] = new_pref

    def recommend(self, user, n=5):
        """
        Recommend items based on closeness to a user's preferences.

        Args:
            user (str)
            n (int): number of results to return

        Returns:
            list of (item_name, score)
        """
        if user not in self._preferences:
            return [("No data for this user yet!", 0.0)]

        user_pref = self._preferences[user]
        recommendations = []

        for item, attrs in self._items.items():
            # Skip items the user already rated
            if user in self._ratings and item in self._ratings[user]:
                continue

            # Score = sum of closeness for each attribute
            score = 0
            for attr, item_value in attrs.items():
                # Closeness: the smaller the difference, the higher the score
                difference = abs(user_pref[attr] - item_value)
                # Max possible difference is small (e.g., 0–2 scale), so:
                score += (3 - difference)  # 3 is a "good enough" max

            recommendations.append((item, score))

        # Sort by score, highest first
        recommendations.sort(key=lambda t: t[1], reverse=True)

        return recommendations[:n]

# If someone runs this file directly, show them a quick demo
if __name__ == "__main__":
    print("=== MLMS Demo ===\n")

    # Create a tiny example chatbot about pets
    demo_bot = TextClassifier()

    demo_data = {
        "dogs": ["do you like dogs?", "tell me about dogs", "what about puppies?"],
        "cats": ["do you like cats?", "tell me about cats", "what about kittens?"],
        "birds": ["do you like birds?", "tell me about birds", "what about parrots?"]
    }

    print("Training a simple pet chatbot...")
    demo_bot.train(demo_data)

    print("\nTesting some questions:\n")

    test_questions = [
        "what can you tell me about dogs?",
        "I want to learn about kittens",
        "do you know about parrots?",
        "what about hamsters?"  # Not in training data!
    ]

    for q in test_questions:
        category, confidence = demo_bot.classify(q)
        print(f"Q: {q}")
        print(f"A: Category '{category}' (confidence: {confidence:.1%})")
        if confidence < 0.3:
            print("   ⚠️  Low confidence - might not understand this question!")
        print()
    # ---------------------------------------
    # Demo: TextRecommender
    # ---------------------------------------
    print("=== Recommender Demo ===\n")

    demo_items = {
        "chips":     {"spicy": 1, "sweet": 0, "crunchy": 2},
        "fruit":     {"spicy": 0, "sweet": 2, "crunchy": 0},
        "granola":   {"spicy": 0, "sweet": 1, "crunchy": 2},
        "salsa":     {"spicy": 2, "sweet": 0, "crunchy": 0},
    }

    rec = TextRecommender()
    rec.set_items(demo_items)

    print("Adding ratings for Alice...")
    rec.add_rating("alice", "chips", 5)    # likes spicy + crunchy
    rec.add_rating("alice", "salsa", 4)

    print("Alice's recommendations:")
    for item, score in rec.recommend("alice"):
        print(f"  {item:10s}  score={score:.2f}")
    print()

    print("Adding ratings for Ben...")
    rec.add_rating("ben", "fruit", 5)      # likes sweet
    rec.add_rating("ben", "granola", 4)

    print("Ben's recommendations:")
    for item, score in rec.recommend("ben"):
        print(f"  {item:10s}  score={score:.2f}")
    print()
