package com.lu.admin.modules.client.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class ClientCommandPushService {

    public interface CommandSubscriber {
        void accept(Map<String, Object> command);
    }

    public interface Subscription {
        void unsubscribe();
    }

    private final Map<Long, CopyOnWriteArrayList<CommandSubscriber>> subscribers = new ConcurrentHashMap<>();
    private final Map<Long, String> pendingPayloads = new ConcurrentHashMap<>();

    public Subscription subscribe(Long robotId, CommandSubscriber subscriber) {
        if (robotId == null || subscriber == null) {
            return () -> {
            };
        }
        CopyOnWriteArrayList<CommandSubscriber> list = subscribers.computeIfAbsent(robotId, key -> new CopyOnWriteArrayList<>());
        list.add(subscriber);
        return () -> unsubscribe(robotId, subscriber);
    }

    public boolean push(Long robotId, Map<String, Object> command) {
        if (robotId == null || command == null || command.isEmpty()) {
            return false;
        }
        List<CommandSubscriber> list = subscribers.get(robotId);
        if (list == null || list.isEmpty()) {
            return false;
        }
        boolean pushed = false;
        for (CommandSubscriber subscriber : list) {
            try {
                subscriber.accept(command);
                pushed = true;
            } catch (RuntimeException ignored) {
                list.remove(subscriber);
            }
        }
        return pushed;
    }

    public void savePayload(Long robotId, String payload) {
        if (robotId == null) {
            return;
        }
        if (payload == null || payload.isEmpty()) {
            pendingPayloads.remove(robotId);
            return;
        }
        pendingPayloads.put(robotId, payload);
    }

    public String takePayload(Long robotId) {
        if (robotId == null) {
            return "";
        }
        String payload = pendingPayloads.remove(robotId);
        return payload == null ? "" : payload;
    }

    public void removePayload(Long robotId) {
        if (robotId != null) {
            pendingPayloads.remove(robotId);
        }
    }

    private void unsubscribe(Long robotId, CommandSubscriber subscriber) {
        CopyOnWriteArrayList<CommandSubscriber> list = subscribers.get(robotId);
        if (list == null) {
            return;
        }
        list.remove(subscriber);
        if (list.isEmpty()) {
            subscribers.remove(robotId, list);
        }
    }
}
