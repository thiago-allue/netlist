# backend/app/validators.py
"""
Light‑weight, plug‑and‑play rule engine for PCB‑netlist hygiene checks.
────────────────────────────────────────────────────────────────────────
• Each rule is a plain function:  rule(netlist) -> List[Violation]
  where a Violation = {"rule", "message", "location", "level"}.
• The master runner concatenates the lists; an empty result ⇒ netlist passes.
• Add / remove rules by editing the `_RULES` list.
"""

from typing import Dict, List

# Alias that clarifies intent in type hints
Violation = Dict[str, str]


# --------------------------------------------------------------------------- 
# Helper –factory for violation dictionaries
# --------------------------------------------------------------------------- 
def _mk(rule: str, msg: str, loc: str = "", level: str = "error") -> Violation:
    """
    Create a Violation object in the canonical shape.
    """
    return {"rule": rule, "message": msg, "location": loc, "level": level}


# ───────────────────────── Rule 1 ──────────────────────────
# Ensure that component, pin and net names are non‑blank
def check_names_not_blank(netlist: dict) -> List[Violation]:
    v: List[Violation] = []

    for comp in netlist["components"]:
        if not comp["name"].strip():
            v.append(
                _mk(
                    "non_blank_names",
                    "Component name blank",
                    f"component:{comp['id']}",
                )
            )

        for pin in comp["pins"]:
            if not pin["name"].strip():
                v.append(
                    _mk(
                        "non_blank_names",
                        "Pin name blank",
                        f"component:{comp['id']}.pin:{pin['id']}",
                    )
                )

    for net in netlist["nets"]:
        if not net["name"].strip():
            v.append(
                _mk(
                    "non_blank_names",
                    "Net name blank",
                    f"net:{net['id']}",
                )
            )

    return v


# ───────────────────────── Rule 2 ──────────────────────────
# Components that declare a GND pin must actually connect to a GND net
def check_gnd_connections(netlist: dict) -> List[Violation]:
    v: List[Violation] = []

    # Gather all nets explicitly named “GND”
    gnd_nets = [n for n in netlist["nets"] if n["name"].upper() == "GND"]
    if not gnd_nets:
        return [_mk("gnd_present", "Net named 'GND' missing")]

    gnd_net_ids = {n["id"] for n in gnd_nets}

    # Build a map: component_id → set(net_ids) for quick look‑ups
    connections_by_comp = {}
    for net in netlist["nets"]:
        for conn in net["connections"]:
            connections_by_comp.setdefault(conn["componentId"], set()).add(net["id"])

    for comp in netlist["components"]:
        # Skip connectors entirely
        if comp["type"].lower() == "connector":
            continue

        # Only enforce rule if the part declares a pin named “GND”
        has_gnd_pin = any(p["name"].upper() == "GND" for p in comp["pins"])
        if not has_gnd_pin:
            continue

        # None of the nets tied to this component are GND ⇒ violation
        if not (connections_by_comp.get(comp["id"], set()) & gnd_net_ids):
            v.append(
                _mk(
                    "gnd_connected",
                    "Component declares a GND pin but it is unconnected",
                    f"component:{comp['id']}",
                )
            )
    return v


# ───────────────────────── Rule 3 ──────────────────────────
# Detect dangling nets and orphan references
def check_dangling(netlist: dict) -> List[Violation]:
    v: List[Violation] = []

    # Pre‑compute quick‑look‑up sets
    comp_ids = {c["id"] for c in netlist["components"]}
    pins_by_comp = {
        c["id"]: {p["id"] for p in c["pins"]} for c in netlist["components"]
    }

    for net in netlist["nets"]:
        # --------------------------------------------------------------------
        # Validate every connection tuple
        # --------------------------------------------------------------------
        for idx, conn in enumerate(net["connections"]):
            cid, pid = conn["componentId"], conn["pinId"]

            if cid not in comp_ids:
                v.append(
                    _mk(
                        "dangling_connection",
                        f"Net references unknown component '{cid}'",
                        f"net:{net['id']}[{idx}]",
                    )
                )
            elif pid not in pins_by_comp[cid]:
                v.append(
                    _mk(
                        "dangling_connection",
                        f"Net references unknown pin '{cid}.{pid}'",
                        f"net:{net['id']}[{idx}]",
                    )
                )

        # --------------------------------------------------------------------
        # Net is useless if it only touches one pin
        # --------------------------------------------------------------------
        if len(net["connections"]) < 2:
            v.append(
                _mk(
                    "dangling_net",
                    "Net has <2 connections (dangling)",
                    f"net:{net['id']}",
                )
            )
    return v


# --------------------------------------------------------------------------- 
# Rule registry –add/remove functions to change policy
# --------------------------------------------------------------------------- 
_RULES = [
    check_names_not_blank,
    check_gnd_connections,
    check_dangling,
]


# --------------------------------------------------------------------------- 
# Runner –execute all rules and concatenate results
# --------------------------------------------------------------------------- 
def run_all(netlist: dict) -> List[Violation]:
    """
    Execute all registered rules and return a **flat list** of violations.
    An empty list ⇒ the netlist is considered valid.
    """

    violations: List[Violation] = []
    for rule in _RULES:
        violations.extend(rule(netlist))
    return violations
