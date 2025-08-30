# AI Contributor Guidelines

This repository contains infrastructure code managed with OpenTofu, Ansible and shell scripts. Follow these guidelines when contributing changes.

## Required Checks
- **Terraform/OpenTofu**: Run `tofu fmt -check` from the `tofu/` directory after modifying any `.tf` files.
- **Ansible**: Run `ansible-lint` from the repository root after changing playbooks or roles under `ansible/`.
- **Shell Scripts**: Run `shellcheck` on any updated `*.sh` script.

If any of these tools are unavailable in your environment, make a best effort attempt and note the failure in the PR description.

