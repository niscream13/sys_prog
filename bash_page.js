const commandGrid = document.querySelector(".bash-theme .cli-grid");

function updateCommandConnectors() {
  if (!commandGrid || window.innerWidth <= 760) {
    return;
  }

  const gridBounds = commandGrid.getBoundingClientRect();
  const lineCenter = gridBounds.left + gridBounds.width / 2 + 1.5;
  const leftConnectorExtension = 4;
  const commandCards = commandGrid.querySelectorAll("article");

  commandCards.forEach((card, index) => {
    const cardBounds = card.getBoundingClientRect();
    const isLeftCard = index % 2 === 0;
    const connectorLength = isLeftCard
      ? lineCenter - cardBounds.right
      : cardBounds.left - lineCenter;
    const adjustedLength = isLeftCard
      ? connectorLength + leftConnectorExtension
      : connectorLength;

    card.style.setProperty(
      "--connector-length",
      `${Math.max(0, adjustedLength)}px`,
    );
  });
}

const connectorObserver = new ResizeObserver(updateCommandConnectors);

if (commandGrid) {
  connectorObserver.observe(commandGrid);
}

window.addEventListener("resize", updateCommandConnectors);
window.addEventListener("load", updateCommandConnectors);

updateCommandConnectors();
