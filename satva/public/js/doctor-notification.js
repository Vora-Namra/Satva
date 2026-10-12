const notificationBtn =
  document.getElementById("notificationBtn");

const notificationPopup =
  document.getElementById("notificationPopup");

const notificationList =
  document.getElementById("notificationList");

const markAllReadBtn =
  document.getElementById("markAllReadBtn");

const notificationCount =
  document.getElementById("notificationCount");

const notificationCountDashboard =
  document.getElementById("notificationCountDashboard");


let notifications = [];


async function updateNotificationCount() {

  const unreadCount =
    await fetchUnreadCount();

  if (notificationCount) {
    notificationCount.innerText = unreadCount;
    if (unreadCount === 0) {
      notificationCount.classList.add("hidden");
    } else {
      notificationCount.classList.remove("hidden");
    }
  }

  if (notificationCountDashboard) {
    notificationCountDashboard.innerText = unreadCount;
  }

}
updateNotificationCount();

function renderNotifications() {
  if (!notificationList) return;

  notificationList.innerHTML = "";

  if (notifications.length === 0) {

    notificationList.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                No notifications
            </div>
        `;

    return;
  }

  notifications.forEach(notification => {

    const div =
      document.createElement("div");

    div.className = `
            p-4 border-b
            ${notification.is_read
        ? "bg-white"
        : "bg-blue-50"}
        `;

    div.innerHTML = `
            <div class="flex justify-between items-start">

                <div>
                    <h4 class="font-medium text-gray-800">
                        ${notification.title}
                    </h4>

                    <p class="text-sm text-gray-600 mt-1">
                        ${notification.notification_message}
                    </p>
                </div>

                ${!notification.is_read
        ?
        `
                    <button
                        class="mark-read-btn text-xs text-primary hover:underline"
                        data-id="${notification.notification_id}"
                    >
                        Mark as read
                    </button>
                    `
        :
        ""
      }

            </div>
        `;

    notificationList.appendChild(div);

  });

  attachMarkReadEvents();


}

function attachMarkReadEvents() {

  document
    .querySelectorAll(".mark-read-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          try {

            const notificationId =
              Number(button.dataset.id);

            const token =
              localStorage.getItem(
                "accessToken"
              );

            const response =
              await fetch(
                `/api/v1/notifications/${notificationId}/read`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                    "Content-Type":
                      "application/json"
                  }
                }
              );

            if (!response.ok) {

              throw new Error(
                "Failed to mark notification as read"
              );

            }

            console.log(response)

            const notification =
              notifications.find(
                n =>
                  n.notification_id ===
                  notificationId
              );

            if (notification) {

              notification.is_read = true;

            }

            renderNotifications();

            updateNotificationCount();

          }
          catch (error) {

            console.error(
              "Error marking notification as read:",
              error
            );

          }

        }
      );

    });

}


if (markAllReadBtn) {
  markAllReadBtn.addEventListener(
  "click",
  async () => {

    try {

      const token =
        localStorage.getItem("accessToken");

      const response =
        await fetch(
          "/api/v1/notifications/read-all",
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

      console.log()
      if (!response.ok) {

        throw new Error(
          "Failed to mark all notifications as read"
        );

      }

      notifications.forEach(
        notification => {
          notification.is_read = true;
        }
      );

      renderNotifications();

      updateNotificationCount();

    }
    catch (error) {

      console.error(
        "Error marking all notifications as read:",
        error
      );

    }

  }
);
}

if (notificationBtn) {
  notificationBtn.addEventListener(
  "click",
  async () => {

    notificationPopup.classList.toggle(
      "hidden"
    );

    if (
      !notificationPopup.classList.contains(
        "hidden"
      )
    ) {

      notifications =
        await fetchNotifications();

      console.log("this is notification :", notifications)
      renderNotifications();

    }

  }
);
}

document.addEventListener(
  "click",
  event => {

    if (
      notificationBtn && notificationPopup &&
      !notificationBtn.contains(event.target)
      &&
      !notificationPopup.contains(event.target)
    ) {

      notificationPopup.classList.add(
        "hidden"
      );

    }

  }
);


updateNotificationCount();


async function fetchNotifications() {

  try {

    const token =
      localStorage.getItem("accessToken");

    const response = await fetch(
      "/api/v1/notifications/unread",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        "Failed to fetch notifications"
      );
    }

    const result =
      await response.json();

    console.log(result)
    return result.data;

  }
  catch (error) {

    console.error(
      "Error fetching notifications:",
      error
    );

    return [];

  }

}

async function fetchUnreadCount() {

  try {

    const token =
      localStorage.getItem("accessToken");

    const response = await fetch(
      "/api/v1/notifications/unread/count",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const result =
      await response.json();


    return result.data.count;


  }
  catch (error) {

    console.error(
      "Failed to fetch unread count:",
      error
    );

    return 0;

  }

}