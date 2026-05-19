import pytest

from common.judgment import distance_to_target, target_is_reached, target_return_is_bearish


def test_target_return_is_bearish():
    assert target_return_is_bearish(-0.1) is True
    assert target_return_is_bearish(0.1) is False


def test_target_is_reached_bullish():
    assert target_is_reached(110.0, 110.0, 0.1) is True
    assert target_is_reached(109.0, 110.0, 0.1) is False


def test_target_is_reached_bearish():
    assert target_is_reached(80.0, 80.0, -0.2) is True
    assert target_is_reached(81.0, 80.0, -0.2) is False


def test_distance_to_target_bullish():
    assert distance_to_target(100.0, 110.0, 0.1, 105.0) == pytest.approx(0.05)


def test_distance_to_target_bearish():
    assert distance_to_target(100.0, 80.0, -0.2, 90.0) == pytest.approx(0.1)
