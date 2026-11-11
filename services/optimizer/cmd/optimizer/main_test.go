package main

import (
	"testing"
	"time"
)

func TestNewHTTPServerConfiguresTimeouts(t *testing.T) {
	server := newHTTPServer(":8080")

	if server.ReadHeaderTimeout != 5*time.Second {
		t.Errorf("expected read header timeout 5s, got %s", server.ReadHeaderTimeout)
	}
	if server.ReadTimeout != 10*time.Second {
		t.Errorf("expected read timeout 10s, got %s", server.ReadTimeout)
	}
	if server.WriteTimeout != 30*time.Second {
		t.Errorf("expected write timeout 30s, got %s", server.WriteTimeout)
	}
	if server.IdleTimeout != 60*time.Second {
		t.Errorf("expected idle timeout 60s, got %s", server.IdleTimeout)
	}
}
