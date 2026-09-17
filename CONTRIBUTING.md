# Contributing to Dinlipi (দিনলিপি) 🍃

Thank you for your interest in contributing to Dinlipi! We welcome contributions from developers, designers, and privacy advocates around the world.

## Code of Conduct
Please be respectful and constructive in all issues, pull requests, and discussions.

## Development Workflow

1. **Fork & Clone**: Fork the repository on GitHub and clone your fork locally.
2. **Branching**: Create a feature branch with a descriptive name:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Dependencies**: Use Bun or Expo CLI:
   ```bash
   bun install
   ```
4. **Code Quality**:
   Before submitting code, ensure that typechecking and linting pass without errors:
   ```bash
   bunx tsc --noEmit
   bun run lint
   ```
5. **Testing on Android**:
   Test on an Android device or emulator with `bunx expo start`.

## Pull Request Guidelines
- Keep pull requests focused on a single change or feature.
- Include a summary of changes and any testing steps.
- Make sure no hardcoded or mock data is introduced.
- Preserve the clean, cozy aesthetic and local-first architecture.

## License
By contributing to Dinlipi, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
