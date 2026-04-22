from common.register_public_messages import format_price_fetch_public, scrub_machine_paths


def test_format_price_fetch_public_shape():
    msg = format_price_fetch_public(
        ValueError("close not_ready last='N/A'"),
        ticker="ASTS",
        market="NASDAQ",
        row_index=5,
        last_raw="N/A",
    )
    assert "NASDAQ:ASTS" in msg
    assert "**5**" in msg
    assert "N/A" in msg
    assert "ValueError" in msg
    assert "GOOGLEFINANCE" in msg


def test_scrub_paths_shortens():
    long = "/home/runner/work/foo/bar/baz" + "x" * 600
    out = scrub_machine_paths(long)
    assert "/home/runner/work/" not in out
    assert len(out) <= 520
