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
    if (Number(unreadCount) === 0) {
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

  // MySQL returns is_read as 1/0 integers — cast to number for reliable check
  const unreadNotifications = notifications
    .filter(n => Number(n.is_read) === 0)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const readNotifications = notifications
    .filter(n => Number(n.is_read) === 1)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const addSectionHeader = (text) => {
    const header = document.createElement("div");
    header.className = "px-4 py-2 bg-gray-100 text-sm font-semibold text-gray-700";
    header.textContent = text;
    notificationList.appendChild(header);
  };

  const renderCard = (notification) => {
    const isRead = Number(notification.is_read) === 1;
    const div = document.createElement("div");
    div.className = `p-4 border-b transition hover:bg-gray-50 ${isRead ? "bg-white" : "bg-blue-50"}`;
    div.innerHTML = `
      <div class="flex justify-between gap-4">
        <div>
          <h4 class="font-medium text-gray-800">${notification.title}</h4>
          <p class="text-sm text-gray-600 mt-1">${notification.notification_message}</p>
          <p class="text-xs text-gray-400 mt-2">${new Date(notification.created_at).toLocaleString()}</p>
        </div>
        ${!isRead ? `
          <button class="mark-read-btn text-xs text-primary hover:underline shrink-0" data-id="${notification.notification_id}">
            Mark as read
          </button>
        ` : ""}
      </div>
    `;
    notificationList.appendChild(div);
  };

  if (unreadNotifications.length > 0) {
    addSectionHeader("Unread");
    unreadNotifications.forEach(renderCard);
  }

  if (readNotifications.length > 0) {
    addSectionHeader("Earlier");
    readNotifications.forEach(renderCard);
  }

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
      "/api/v1/notifications",
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