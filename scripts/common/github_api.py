from __future__ import annotations

import os
from typing import Any

import requests


def _repo_parts() -> tuple[str, str]:
    repo = os.environ.get("REPO", "")
    if "/" not in repo:
        raise RuntimeError("REPO must be set to owner/name")
    owner, name = repo.split("/", 1)
    return owner, name


def _headers() -> dict[str, str]:
    token = os.environ.get("GITHUB_TOKEN", "")
    if not token:
        raise RuntimeError("GITHUB_TOKEN is required")
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json, application/vnd.github.squirrel-girl-preview+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def add_issue_comment(issue_number: int, body: str) -> None:
    owner, repo = _repo_parts()
    url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}/comments"
    r = requests.post(url, headers=_headers(), json={"body": body}, timeout=120)
    r.raise_for_status()


def add_issue_label(issue_number: int, label: str) -> None:
    owner, repo = _repo_parts()
    url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}/labels"
    r = requests.post(url, headers=_headers(), json={"labels": [label]}, timeout=60)
    if r.status_code not in (200, 201):
        r.raise_for_status()


def remove_issue_label(issue_number: int, label: str) -> None:
    owner, repo = _repo_parts()
    url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}/labels/{label}"
    r = requests.delete(url, headers=_headers(), timeout=60)
    if r.status_code == 404:
        return
    r.raise_for_status()


def get_issue_reactions(issue_number: int) -> dict[str, int]:
    owner, repo = _repo_parts()
    url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}/reactions"
    r = requests.get(url, headers=_headers(), timeout=60)
    if r.status_code == 404:
        return {"likes": 0, "dislikes": 0}
    r.raise_for_status()
    likes = dislikes = 0
    for item in r.json():
        c = item.get("content")
        if c == "+1":
            likes += 1
        elif c == "-1":
            dislikes += 1
    return {"likes": likes, "dislikes": dislikes}
