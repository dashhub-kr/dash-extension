/* --------------------------------------------------------------------------
   Toast Notification
   -------------------------------------------------------------------------- */

const ToastType = {
    Danger: "#eb3b5a",
    Warning: "#fdcb6e",
    Success: "#00b894",
};

class Toast {
    constructor(message, color, time) {
        this.message = message;
        this.color = color;
        this.time = time;
        this.element = null;

        const element = document.createElement("div");
        element.className = "dh-toast-notification";
        this.element = element;

        const countElements = document.getElementsByClassName("dh-toast-notification");

        element.style.opacity = 0.8;
        element.style.marginBottom = countElements.length * 55 + "px";
        element.style.backgroundColor = this.color;

        const msgContainer = document.createElement("div");
        msgContainer.className = "dh-message-container";
        msgContainer.textContent = this.message;
        element.appendChild(msgContainer);

        const closeBtn = document.createElement("div");
        closeBtn.className = "close-notification";
        const icon = document.createElement("i");
        icon.className = "lni lni-close";
        closeBtn.appendChild(icon);
        element.appendChild(closeBtn);

        document.body.appendChild(element);

        setTimeout(() => {
            element.remove();
        }, this.time);

        element.addEventListener("click", () => {
            element.remove();
        });
    }

    static raiseToast(message, duration = 5000) {
        return new Toast(message, ToastType.Danger, duration);
    }
}